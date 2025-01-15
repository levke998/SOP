let token = "";

function formatDate(utcDateString) {
    const date = new Date(utcDateString);
    return date.toLocaleDateString("hu-HU", { timeZone: "Europe/Budapest" });
}

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    const response = await fetch("/login", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });
  
    const resultElement = document.getElementById("result");
  
    try {
        const data = await response.json();
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
    const response = await fetch("/meccsek");
    const data = await response.json();
  
    const matchesList = document.getElementById("matches-list");
    matchesList.innerHTML = "";
    data.forEach(match => {
        const formattedDate = formatDate(match.datum);
        const li = document.createElement("li");
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

    const datum = document.getElementById("datum").value;
    const kezdes = document.getElementById("kezdes").value;
    const belepo = document.getElementById("belepo").value;
    const tipus = document.getElementById("tipus").value;

    const response = await fetch("/meccsek", {
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

async function getViewerStats() {
    const matchId = document.getElementById("stats-match-id").value;
  
    if (!matchId) {
        alert("Kérlek, add meg a mérkőzés ID-ját!");
        return;
    }
  
    const response = await fetch(`/belepesek/${matchId}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
  
    const statsList = document.getElementById("viewer-stats-list");
    statsList.innerHTML = "";
  
    if (response.ok) {
        const data = await response.json();
  
        if (data.length === 0) {
            statsList.innerHTML = `<li class="list-group-item text-danger">Nincs adat a megadott mérkőzéshez.</li>`;
            return;
        }
  
        data.forEach((entry) => {
            const li = document.createElement("li");
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
  
  
async function getChampionshipMatches() {
    const response = await fetch("/bajnoki");
    const list = document.getElementById("championship-matches");
    list.innerHTML = "";
  
    if (response.ok) {
        const data = await response.json();
        data.forEach(match => {
        const li = document.createElement("li");
            li.className = "list-group-item";
            li.innerText = `Dátum: ${formatDate(match.datum)}`;
            list.appendChild(li);
        });
    } else {
        alert("Hiba a bajnoki mérkőzések lekérdezésekor.");
    }
}
  
async function getLastMatchPrice() {
        const response = await fetch("/utolsojegyar");
        const resultElement = document.getElementById("last-match-price");
  
    if (response.ok) {
        const data = await response.json();
        resultElement.innerText = `Legutolsó mérkőzés jegyára: ${data[0]?.belepo || "N/A"} Ft`;
    } else {
        resultElement.innerText = "Hiba a jegyár lekérdezésekor.";
    }
}
  
async function deleteMatch() {
    const matchId = document.getElementById("delete-id").value;
  
    if (!token) {
        alert("Először jelentkezz be!");
        return;
    }
  
    const response = await fetch(`/meccsek/${matchId}`, {
        method: "DELETE",
        headers: {
        Authorization: `Bearer ${token}`,
        },
    });
  
    const resultElement = document.getElementById("result");
  
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
    const name = document.getElementById("viewer-name").value;
    const gender = document.getElementById("viewer-gender").value;
    const ticket = document.getElementById("viewer-ticket").value;
  
    const response = await fetch("/nezok", {
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

async function addEntry() {
    const viewerId = document.getElementById("entry-viewer-id").value;
    const matchId = document.getElementById("entry-match-id").value;
    const timestamp = document.getElementById("entry-timestamp").value;
  
    const response = await fetch("/belepes", {
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
  
  
  
