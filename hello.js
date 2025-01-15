var http = require("http");
var express = require("express");
var app = express();
var mysql = require("mysql");
var bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const secretKey = "your_secret_key";
const cors = require('./cors');

//MySQL kapcsolat
var connection = mysql.createConnection({
    host: "localhost", //host
    user: "root", //felhasználó
    password: "Levente-89", //jelszó
    database: "restapidb" //db
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("A csatlakozás sikerült...");
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true,}));


//Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

var server = app.listen(3000, "127.0.0.1", function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Figyeljük a következő URI-t http://%s:%s", host, port);
    console.log("Swagger dokumentáció elérhető: http://%s:%s/api-docs", host, port);
});

app.use(express.static("public")) 


//Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(403).send("Nincs jogosultság");
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).send("Érvénytelen token");
        }
    req.user = user;
    next();
  });
}


// Login
app.post("/login", function (req, res) {
    const { username, password } = req.body;

    connection.query("SELECT * FROM users WHERE username = ? AND pw = ?",[username, password],function (error, results) {
        if (error) {
            return res.status(500).json({ message: "Adatbázis hiba" });
        }

        if (results.length > 0) {
            const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
            res.json({ token });
        } else {
            res.status(401).json({ message: "Hibás felhasználónév vagy jelszó" });
        }
    }
  );
});


//Minden mérkőzés listázása
app.get("/meccsek", function (req, res) {
    connection.query("SELECT * FROM meccs ORDER BY datum", function (error, results) {
        if (error) throw error;
        res.json(results);
    });
});


//Bajnoki mérkőzések dátumainak időrendi megjelenítése
app.get("/bajnoki", function (req, res) {
    const sql = "SELECT datum FROM meccs WHERE tipus = 'bajnoki' ORDER BY datum";
    connection.query(sql, function (error, results) {
        if (error) throw error;
        res.json(results);
    });
});


//Nézőszám lekérdezése adott mérkőzésre
app.get("/belepesek/:meccsid", authenticateToken, function (req, res) {
    const sql = `SELECT n.nev, n.ferfi, n.berletes, b.idopont FROM belepes b JOIN nezo n ON b.nezoid = n.id WHERE b.meccsid = ? ORDER BY b.idopont`;
    connection.query(sql, [req.params.meccsid], function (error, results) {
        if (error) {
            return res.status(500).json({ message: "Adatbázis hiba" });
        }
        res.json(results);
    });
});
  

//Idény legutolsó mérkőzésének jegyára
app.get("/utolsojegyar", function (req, res) {
    const sql = "SELECT belepo FROM meccs ORDER BY datum DESC, kezdes DESC LIMIT 1";
    connection.query(sql, function (error, results) {
        if (error) throw error;
        res.json(results);
    });
});


//Új mérkőzés hozzáadása -> Csak tokennel!
app.post("/meccsek", authenticateToken, function (req, res) {
    var postData = req.body;
    connection.query("INSERT INTO meccs SET ?", postData, function (error, results) {
        if (error) throw error;
        res.json(results);
    });
});


//Nézők hozzáadása -> Csak tokennel!
app.post("/nezok", authenticateToken, function (req, res) {
    const { nev, ferfi, berletes } = req.body;
  
    const sql = "INSERT INTO nezo (nev, ferfi, berletes) VALUES (?, ?, ?)";
    connection.query(sql, [nev, ferfi, berletes], function (error, results) {
      if (error) {
        return res.status(500).json({ message: "Adatbázis hiba" });
      }
      res.status(201).json({ message: "Néző sikeresen hozzáadva", id: results.insertId });
    });
});


//Nézők beléptetése mérkőzésre -> Csak tokennel!
app.post("/belepes", authenticateToken, function (req, res) {
    const { nezoid, meccsid, idopont } = req.body;
  
    const sql = "INSERT INTO belepes (nezoid, meccsid, idopont) VALUES (?, ?, ?)";
    connection.query(sql, [nezoid, meccsid, idopont], function (error, results) {
        if (error) {
            return res.status(500).json({ message: "Adatbázis hiba" });
        }
        res.status(201).json({ message: "Belépés sikeresen rögzítve" });
    });
});


//Mérkőzés törlése ID alapján -> Csak tokennel!
app.delete("/meccsek/:id", authenticateToken, function (req, res) {
    connection.query("DELETE FROM meccs WHERE id = ?", [req.params.id], function (error, results) {
        if (error) throw error;
        res.send("Mérkőzés törölve.");
    });
});
