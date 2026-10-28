
/* =====================================
   RACHA DE 15 DIAS
   SISTEMA DE PARTICIPANTES
===================================== */

// CONFIGURACION INICIAL

const TOTAL_DIAS = 15;

// Nombres provisionales
const participantes = [
    "Dilia Gonzales",
    "Bryan Monterroso",
    "Manyuri Melendez",
    "Antonio",
    "Sherlin del Cid",
    "Josue",
    "Efren",
    "Celeste",
    "Ismael",
    "Luisito",
    "Angela",
    "Jeimy del Cid",
    "Nery",
    "Dylan Hernandez",
    "Dany"
];

// Los avances se guardan temporalmente
// en este navegador. Luego conectaremos Supabase.

let registros = JSON.parse(
    localStorage.getItem("racha15_registros")
) || {};

// Día seleccionado
let diaSeleccionado = 1;

// Modo de prueba.
// La autenticación real se configurará con Supabase.
const modoAdministrador = true;


// CREAR REGISTROS INICIALES

participantes.forEach((nombre, indice) => {
    const id = indice + 1;

    if (!registros[id]) {
        registros[id] = {
            nombre: nombre,
            lecturas: []
        };
    }
});


// GUARDAR AVANCES

function guardarAvances() {
    localStorage.setItem(
        "racha15_registros",
        JSON.stringify(registros)
    );
}


// GENERAR CALENDARIO

function generarDias() {
    const contenedor = document.getElementById("days-grid");

    contenedor.innerHTML = "";

    for (let dia = 1; dia <= TOTAL_DIAS; dia++) {

        const completados = participantes.filter((nombre, indice) => {
            return registros[indice + 1].lecturas.includes(dia);
        }).length;

        const tarjeta = document.createElement("div");

        tarjeta.className = "day-card";

        if (dia === diaSeleccionado) {
            tarjeta.classList.add("selected");
        }

        if (completados === participantes.length) {
            tarjeta.classList.add("completed");
        }

        tarjeta.innerHTML = `
            <h3>Día ${dia}</h3>
            <span>${completados}/15 lecturas</span>
        `;

        tarjeta.addEventListener("click", () => {
            diaSeleccionado = dia;
            actualizarPagina();
        });

        contenedor.appendChild(tarjeta);
    }
}


// GENERAR PARTICIPANTES

function generarParticipantes() {
    const contenedor = document.getElementById("participants-list");

    contenedor.innerHTML = "";

    participantes.forEach((nombre, indice) => {

        const id = indice + 1;
        const participante = registros[id];

        const completadas = participante.lecturas.length;

        const yaMarco = participante.lecturas.includes(diaSeleccionado);

        const tarjeta = document.createElement("article");

        tarjeta.className = "participant-card";

        tarjeta.innerHTML = `
            <div class="participant-info">
                <h3>${participante.nombre}</h3>
                <p>Lecturas completadas: ${completadas}/15</p>
            </div>

            <div class="participant-progress">
                <strong>${completadas}/15</strong>
                <span>
                    ${yaMarco ? "Día marcado ✓" : "Día pendiente"}
                </span>
                ${
                    modoAdministrador
                    ? `<button class="reading-btn ${yaMarco ? "marked" : ""}">
                        ${yaMarco ? "Desmarcar" : "Marcar lectura"}
                       </button>`
                    : ""
                }
            </div>
        `;

        if (modoAdministrador) {
            const boton = tarjeta.querySelector(".reading-btn");

            boton.addEventListener("click", () => {
                marcarLectura(id);
            });
        }

        contenedor.appendChild(tarjeta);
    });
}


// MARCAR O DESMARCAR UNA LECTURA

function marcarLectura(id) {

    const lecturas = registros[id].lecturas;

    if (lecturas.includes(diaSeleccionado)) {

        registros[id].lecturas = lecturas.filter(
            dia => dia !== diaSeleccionado
        );

    } else {

        lecturas.push(diaSeleccionado);

    }

    guardarAvances();
    actualizarPagina();
}


// MARCAR TODOS LOS PARTICIPANTES

function marcarTodos() {

    participantes.forEach((nombre, indice) => {

        const id = indice + 1;

        if (!registros[id].lecturas.includes(diaSeleccionado)) {
            registros[id].lecturas.push(diaSeleccionado);
        }

    });

    guardarAvances();
    actualizarPagina();
}


// ACTUALIZAR ESTADISTICAS

function actualizarEstadisticas() {

    const totalLecturas = participantes.reduce(
        (total, nombre, indice) => {
            return total + registros[indice + 1].lecturas.length;
        },
        0
    );

    const diasCompletados = Array.from(
        { length: TOTAL_DIAS },
        (_, indice) => indice + 1
    ).filter(dia => {
        return participantes.every((nombre, indice) => {
            return registros[indice + 1].lecturas.includes(dia);
        });
    }).length;

    const lecturasHoy = participantes.filter((nombre, indice) => {
        return registros[indice + 1].lecturas.includes(diaSeleccionado);
    }).length;

    document.getElementById("completed-days").textContent =
        `${diasCompletados}/15`;

    document.getElementById("today-count").textContent =
        `${lecturasHoy}/15`;

    document.getElementById("group-progress").style.width =
        `${(totalLecturas / 225) * 100}%`;
}


// BOTON MARCAR TODOS

const botonMarcarTodos = document.getElementById("mark-all-btn");

if (modoAdministrador) {
    botonMarcarTodos.hidden = false;
    botonMarcarTodos.addEventListener("click", marcarTodos);
}


// ACTUALIZAR TODA LA PAGINA

function actualizarPagina() {
    generarDias();
    generarParticipantes();
    actualizarEstadisticas();
}


// INICIAR

guardarAvances();
actualizarPagina();
