let token = "";

function formatDate(utcDateString) {
    var date = new Date(utcDateString);
    return date.toLocaleDateString("hu-HU", { timeZone: "Europe/Budapest" });
}

async function login() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
  
    var response = await fetch("/login", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });
  
    var resultElement = document.getElementById("result");
  
    try {
        var data = await response.json();
        if (response.ok) {
            token = data.token;
            resultElement.innerText = "Sikeres bejelentkezés! Token mentve.";
            resultElement.className = "alert alert-success";
        } else {
        resultElement.innerText = data.message || "Hibás felhasználónév vagy jelszó.";
        resultElement.className = "alert alert-danger";
        }
    } catch (err) {
        resultElement.innerText = "Nem megfelelő szerverválasz.";
        resultElement.className = "alert alert-danger";
    }
}
  
  

async function getMatches() {
    var response = await fetch("/meccsek");
    var data = await response.json();
  
    var matchesList = document.getElementById("matches-list");
    matchesList.innerHTML = "";
    data.forEach(match => {
        var formattedDate = formatDate(match.datum);
        var li = document.createElement("li");
        li.className = "list-group-item";
        li.innerText = `${match.id} - ${formattedDate} ${match.kezdes} - ${match.tipus} (${match.belepo} Ft)`;
        matchesList.appendChild(li);
    });
}

async function addMatch() {
    if (!token) {
        document.getElementById("result").innerText = "Először jelentkezz be!";
        return;
    }

    var datum = document.getElementById("datum").value;
    var kezdes = document.getElementById("kezdes").value;
    var belepo = document.getElementById("belepo").value;
    var tipus = document.getElementById("tipus").value;

    var response = await fetch("/meccsek", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    },
        body: JSON.stringify({ datum, kezdes, belepo, tipus })
    });

    if (response.ok) {
        document.getElementById("result").innerText = "Mérkőzés sikeresen hozzáadva!";
        getMatches();
    } else {
        document.getElementById("result").innerText = "Hiba a hozzáadás során.";
    }
}

async function getNezok() {
    var matchId = document.getElementById("stats-match-id").value;
  
    if (!matchId) {
        alert("Kérlek, add meg a mérkőzés ID-ját!");
        return;
    }
  
    var response = await fetch(`/belepesek/${matchId}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
  
    var statsList = document.getElementById("viewer-stats-list");
    statsList.innerHTML = "";
  
    if (response.ok) {
        var data = await response.json();
  
        if (data.length === 0) {
            statsList.innerHTML = `<li class="list-group-item text-danger">Nincs adat a megadott mérkőzéshez.</li>`;
            return;
        }
  
        data.forEach((entry) => {
            var li = document.createElement("li");
            li.className = "list-group-item";
            li.innerText = `${entry.nev} - ${
            entry.ferfi ? "Férfi" : "Nő"
        } - ${entry.berletes ? "Bérletes" : "Normál jegy"} - Belépett: ${formatDate(
            entry.idopont
        )}`;
        statsList.appendChild(li);
        });
    } else {
        alert("Hiba a nézőszám lekérdezésekor.");
    }
  }
  
  
async function getBajnokiMeccsek() {
    var response = await fetch("/bajnoki");
    var list = document.getElementById("championship-matches");
    list.innerHTML = "";
  
    if (response.ok) {
        var data = await response.json();
        data.forEach(match => {
            var li = document.createElement("li");
            li.className = "list-group-item";
            li.innerText = `Dátum: ${formatDate(match.datum)}`;
            list.appendChild(li);
        });
    } else {
        alert("Hiba a bajnoki mérkőzések lekérdezésekor.");
    }
}
  
async function getUtolsoMeccsAr() {
    
    var resultElement = document.getElementById("last-match-price");

    if (!token) {
        alert("Először jelentkezz be!");
        return;
    }

    var response = await fetch("/utolsojegyar", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    

    if (response.ok) {
        var data = await response.json();
        resultElement.innerText = `Legutolsó mérkőzés jegyára: ${data[0]?.belepo || "N/A"} Ft`;
    } else {
        resultElement.innerText = "Hiba a jegyár lekérdezésekor.";
    }
}
  
async function deleteMatch() {
    var matchId = document.getElementById("delete-id").value;
  
    if (!token) {
        alert("Először jelentkezz be!");
        return;
    }
  
    var response = await fetch(`/meccsek/${matchId}`, {
        method: "DELETE",
        headers: {
        Authorization: `Bearer ${token}`,
        },
    });
  
    var resultElement = document.getElementById("result");
  
    if (response.ok) {
        resultElement.innerText = "Mérkőzés sikeresen törölve.";
        resultElement.className = "alert alert-success";
        getMatches();
    } else {
        resultElement.innerText = "Hiba a mérkőzés törlésekor.";
        resultElement.className = "alert alert-danger";
    }
}

async function addViewer() {
    var name = document.getElementById("viewer-name").value;
    var gender = document.getElementById("viewer-gender").value;
    var ticket = document.getElementById("viewer-ticket").value;
  
    var response = await fetch("/nezok", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ nev: name, ferfi: gender === "true", berletes: ticket === "true" })
    });
  
    if (response.ok) {
        alert("Néző sikeresen hozzáadva!");
    } else {
        alert("Hiba történt a néző hozzáadásakor.");
    }
}

async function addBelepo() {
    var viewerId = document.getElementById("entry-viewer-id").value;
    var matchId = document.getElementById("entry-match-id").value;
    var timestamp = document.getElementById("entry-timestamp").value;
  
    var response = await fetch("/belepes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ nezoid: viewerId, meccsid: matchId, idopont: timestamp })
    });
  
    if (response.ok) {
        alert("Néző sikeresen beléptetve!");
    } else {
        alert("Hiba történt a beléptetés során.");
    }
  }
  
  
  
