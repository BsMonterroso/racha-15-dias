
/* =====================================
   RACHA DE 15 DIAS
   SISTEMA DE PARTICIPANTES
===================================== */

// CONFIGURACION DE SUPABASE

const SUPABASE_URL = "https://ppohujzfmupyfoswrykw.supabase.co";
const SUPABASE_KEY = "sb_publishable_9JvmaFGEOixLjhncpC9-Mg_i0QxlgrN";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// CONFIGURACION INICIAL

const TOTAL_DIAS = 15;

let participantes = [];
let registros = {};
let diaSeleccionado = 1;
let modoAdministrador = false;


// =====================================
// AUTENTICACION DEL ADMINISTRADOR
// =====================================

async function verificarAdministrador() {

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    modoAdministrador = false;

    if (session) {

        const { data, error } = await supabaseClient
            .from("administrators")
            .select("user_id")
            .eq("user_id", session.user.id)
            .maybeSingle();

        if (!error && data) {
            modoAdministrador = true;
        } else {
            await supabaseClient.auth.signOut();
        }
    }

    actualizarEstadoAcceso();
}


// =====================================
// ESTADO DEL ACCESO
// =====================================

function actualizarEstadoAcceso() {

    const formulario = document.getElementById("admin-login");
    const botonCerrar = document.getElementById("logout-btn");
    const mensaje = document.getElementById("login-message");
    const botonMarcarTodos = document.getElementById("mark-all-btn");

    if (formulario) {
        formulario.hidden = modoAdministrador;
    }

    if (botonCerrar) {
        botonCerrar.hidden = !modoAdministrador;
    }

    if (botonMarcarTodos) {
        botonMarcarTodos.hidden = !modoAdministrador;
    }

    if (mensaje) {
        mensaje.textContent = modoAdministrador
            ? "Sesión de administrador iniciada."
            : "";
    }
}


// =====================================
// INICIAR SESION
// =====================================

const formularioLogin = document.getElementById("login-form");

if (formularioLogin) {

    formularioLogin.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        const correo = document.getElementById("admin-email").value;
        const contrasena = document.getElementById("admin-password").value;
        const mensaje = document.getElementById("login-message");

        mensaje.textContent = "Verificando acceso...";

        const { data, error } = await supabaseClient.auth
            .signInWithPassword({
                email: correo,
                password: contrasena
            });

        if (error) {
            console.error("Error al iniciar sesión:", error);
            mensaje.textContent = "Correo o contraseña incorrectos.";
            return;
        }

        const { data: administrador, error: errorAdmin } =
            await supabaseClient
                .from("administrators")
                .select("user_id")
                .eq("user_id", data.user.id)
                .maybeSingle();

        if (errorAdmin || !administrador) {

            await supabaseClient.auth.signOut();

            mensaje.textContent =
                "Este usuario no tiene permisos de administrador.";

            return;
        }

        document.getElementById("admin-password").value = "";

        modoAdministrador = true;

        actualizarEstadoAcceso();
        actualizarPagina();

    });

}


// =====================================
// CERRAR SESION
// =====================================

const botonCerrarSesion = document.getElementById("logout-btn");

if (botonCerrarSesion) {

    botonCerrarSesion.addEventListener("click", async () => {

        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error("Error al cerrar sesión:", error);
            return;
        }

        modoAdministrador = false;

        actualizarEstadoAcceso();
        actualizarPagina();

    });

}


// =====================================
// CARGAR PARTICIPANTES Y LECTURAS
// =====================================

async function cargarParticipantes() {

    const { data: personas, error: errorPersonas } =
        await supabaseClient
            .from("participants")
            .select("*")
            .eq("active", true)
            .order("created_at", { ascending: true });

    if (errorPersonas) {
        console.error("Error al cargar participantes:", errorPersonas);
        alert("No se pudieron cargar los participantes.");
        return;
    }

    const { data: lecturas, error: errorLecturas } =
        await supabaseClient
            .from("readings")
            .select("*");

    if (errorLecturas) {
        console.error("Error al cargar lecturas:", errorLecturas);
        alert("No se pudieron cargar las lecturas.");
        return;
    }

    participantes = personas || [];
    registros = {};

    participantes.forEach((participante) => {

        registros[participante.id] = {
            nombre: participante.name,
            lecturas: (lecturas || [])
                .filter(lectura =>
                    lectura.participant_id === participante.id
                )
                .map(lectura => lectura.day_number)
        };

    });

    actualizarPagina();

    console.log("Participantes cargados:", participantes.length);
}


// =====================================
// GENERAR LOS 15 DIAS
// =====================================

function generarDias() {

    const contenedor = document.getElementById("days-grid");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    for (let dia = 1; dia <= TOTAL_DIAS; dia++) {

        const completados = participantes.filter((participante) => {
            return registros[participante.id].lecturas.includes(dia);
        }).length;

        const tarjeta = document.createElement("div");

        tarjeta.className = "day-card";

        if (dia === diaSeleccionado) {
            tarjeta.classList.add("selected");
        }

        if (
            participantes.length > 0 &&
            completados === participantes.length
        ) {
            tarjeta.classList.add("completed");
        }

        tarjeta.innerHTML = `
            <h3>Día ${dia}</h3>
            <span>${completados}/${participantes.length} lecturas</span>
        `;

        tarjeta.addEventListener("click", () => {
            diaSeleccionado = dia;
            actualizarPagina();
        });

        contenedor.appendChild(tarjeta);
    }
}


// =====================================
// GENERAR LISTA DE PARTICIPANTES
// =====================================

function generarParticipantes() {

    const contenedor = document.getElementById("participants-list");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    participantes.forEach((participante) => {

        const id = participante.id;
        const datos = registros[id];

        const completadas = datos.lecturas.length;
        const yaMarco = datos.lecturas.includes(diaSeleccionado);

        const tarjeta = document.createElement("article");

        tarjeta.className = "participant-card";

        tarjeta.innerHTML = `
            <div class="participant-info">
                <h3>${participante.name}</h3>
                <p>Lecturas completadas: ${completadas}/15</p>
            </div>

            <div class="participant-progress">
                <strong>${completadas}/15</strong>

                <span>
                    ${yaMarco ? "Día marcado ✓" : "Día pendiente"}
                </span>

                ${
                    modoAdministrador
                    ? `<button type="button" class="reading-btn ${yaMarco ? "marked" : ""}">
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


// =====================================
// MARCAR O DESMARCAR UNA LECTURA
// =====================================

async function marcarLectura(id) {

    const lecturas = registros[id].lecturas;
    const yaMarco = lecturas.includes(diaSeleccionado);

    if (yaMarco) {

        const { error } = await supabaseClient
            .from("readings")
            .delete()
            .eq("participant_id", id)
            .eq("day_number", diaSeleccionado);

        if (error) {
            console.error("Error al eliminar lectura:", error);
            alert("No se pudo eliminar la lectura.");
            return;
        }

        registros[id].lecturas = lecturas.filter(
            dia => dia !== diaSeleccionado
        );

    } else {

        const { error } = await supabaseClient
            .from("readings")
            .insert({
                participant_id: id,
                day_number: diaSeleccionado
            });

        if (error) {
            console.error("Error al guardar lectura:", error);
            alert("No se pudo guardar la lectura.");
            return;
        }

        lecturas.push(diaSeleccionado);
    }

    actualizarPagina();
}


// =====================================
// MARCAR TODOS LOS PARTICIPANTES
// =====================================

async function marcarTodos() {

    if (!modoAdministrador) {
        alert("Debes iniciar sesión como administrador.");
        return;
    }

    const pendientes = participantes.filter((participante) => {
        return !registros[participante.id].lecturas.includes(diaSeleccionado);
    });

    if (pendientes.length === 0) {
        alert("Todos ya tienen marcada esta lectura.");
        return;
    }

    const nuevasLecturas = pendientes.map((participante) => ({
        participant_id: participante.id,
        day_number: diaSeleccionado
    }));

    const { error } = await supabaseClient
        .from("readings")
        .insert(nuevasLecturas);

    if (error) {
        console.error("Error al marcar todos:", error);
        alert("Error al guardar: " + error.message);
        return;
    }

    pendientes.forEach((participante) => {
        registros[participante.id].lecturas.push(diaSeleccionado);
    });

    actualizarPagina();

    alert("¡Lectura marcada para todos correctamente!");
}


// =====================================
// CONECTAR BOTON MARCAR TODOS
// =====================================

const botonMarcarTodos = document.getElementById("mark-all-btn");

if (botonMarcarTodos) {
    botonMarcarTodos.addEventListener("click", marcarTodos);
    botonMarcarTodos.hidden = true;
}


// =====================================
// ACTUALIZAR ESTADISTICAS
// =====================================

function actualizarEstadisticas() {

    const totalLecturas = participantes.reduce(
        (total, participante) => {
            return total + registros[participante.id].lecturas.length;
        },
        0
    );

    const diasCompletados = Array.from(
        { length: TOTAL_DIAS },
        (_, indice) => indice + 1
    ).filter(dia => {

        return participantes.length > 0 &&
            participantes.every((participante) => {
                return registros[participante.id].lecturas.includes(dia);
            });

    }).length;

    const lecturasHoy = participantes.filter((participante) => {
        return registros[participante.id].lecturas.includes(diaSeleccionado);
    }).length;

    const elementoDias = document.getElementById("completed-days");
    const elementoHoy = document.getElementById("today-count");
    const progreso = document.getElementById("group-progress");

    if (elementoDias) {
        elementoDias.textContent = `${diasCompletados}/15`;
    }

    if (elementoHoy) {
        elementoHoy.textContent = `${lecturasHoy}/${participantes.length}`;
    }

    if (progreso) {
        progreso.style.width =
            `${(totalLecturas / (participantes.length * TOTAL_DIAS || 1)) * 100}%`;
    }
}


// =====================================
// ACTUALIZAR TODA LA PAGINA
// =====================================

function actualizarPagina() {

    generarDias();
    generarParticipantes();
    actualizarEstadisticas();

}


// =====================================
// INICIAR SISTEMA
// =====================================

async function iniciarSistema() {

    await verificarAdministrador();
    await cargarParticipantes();

}

iniciarSistema();
