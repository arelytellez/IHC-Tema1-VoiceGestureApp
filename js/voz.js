let OPENAI_API_KEY = null;
const MOCKAPI_URL = "https://698def71aded595c2530911b.mockapi.io/api/v1/apikey";

const estadoMicrofono = document.getElementById("estadoMicrofono");
const estadoSistema = document.getElementById("estadoSistema");
const textoEscuchado = document.getElementById("textoEscuchado");
const ordenRecibida = document.getElementById("ordenRecibida");
const boton = document.getElementById("btnActivar");

/* ==========================
   COMANDOS VÁLIDOS
========================== */
const comandosValidos = [
  "avanzar",
  "retroceder",
  "detener",
  "vuelta derecha",
  "vuelta izquierda",
  "90 derecha",
  "90 izquierda",
  "360 derecha",
  "360 izquierda"
];

/* ==========================
   VOZ (SÍNTESIS)
========================== */
function hablar(texto) {
  window.speechSynthesis.cancel();

  const mensaje = new SpeechSynthesisUtterance(texto);
  mensaje.lang = "es-ES";
  mensaje.rate = 1;

  window.speechSynthesis.speak(mensaje);
}

/* ==========================
   OBTENER API KEY
========================== */
async function obtenerApiKey() {
  try {
    const response = await fetch(MOCKAPI_URL);
    const data = await response.json();

    OPENAI_API_KEY = data[0].apikey;

    console.log("API KEY cargada correctamente");

  } catch (error) {
    console.error("Error cargando API KEY:", error);
    estadoSistema.textContent = "Error al cargar API Key";
  }
}

/* ==========================
   INTERPRETAR CON OPENAI
========================== */
async function interpretarConOpenAI(textoUsuario) {

  if (!OPENAI_API_KEY) {
    console.error("API KEY no disponible");
    return null;
  }

  try {

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Eres un sistema que convierte frases en comandos de control para un carrito robot.

SOLO puedes responder EXACTAMENTE con uno de estos comandos:

avanzar
retroceder
detener
vuelta derecha
vuelta izquierda
90 derecha
90 izquierda
360 derecha
360 izquierda

Si el usuario pide lo contrario de detener responde: avanzar.
Si no hay intención clara responde: ninguno.

No expliques nada.
Responde solo el comando.
`
          },
          {
            role: "user",
            content: textoUsuario
          }
        ],
        temperature: 0
      })
    });

    const data = await response.json();

    if (!data.choices) {
      console.error("Respuesta inválida:", data);
      return null;
    }

    const respuesta = data.choices[0].message.content
      .toLowerCase()
      .trim();

    console.log("Respuesta IA:", respuesta);

    if (respuesta === "ninguno") return null;

    return respuesta;

  } catch (error) {
    console.error("Error OpenAI:", error);
    estadoSistema.textContent = "Error al consultar IA";
    return null;
  }
}

/* ==========================
   RECONOCIMIENTO DE VOZ
========================== */
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.lang = "es-ES";
recognition.continuous = true;
recognition.interimResults = false;

recognition.onstart = () => {
  estadoMicrofono.textContent = "🎧 Micrófono activo";
};

recognition.onerror = (event) => {
  console.error("Error micrófono:", event.error);
  estadoSistema.textContent = "Error micrófono: " + event.error;
};

recognition.onend = () => {
  recognition.start(); // reinicio automático
};

recognition.onresult = async (event) => {

  const texto = event.results[event.results.length - 1][0].transcript
    .toLowerCase()
    .trim();

  textoEscuchado.textContent = texto;

  if (!texto.includes("nova")) return;

  estadoSistema.textContent = "Analizando comando con IA...";

  const comandoIA = await interpretarConOpenAI(texto);

  if (comandoIA && comandosValidos.includes(comandoIA)) {

    ordenRecibida.textContent = comandoIA;
    estadoSistema.textContent = "Orden ejecutada";

    enviarComandoAlCarrito(comandoIA);

  } else {
    estadoSistema.textContent = "No se detectó una orden válida";
  }
};

/* ==========================
   ENVÍO AL CARRITO
========================== */
function enviarComandoAlCarrito(comando) {
  console.log("Enviando al carrito:", comando);

  // Aquí conectas tu Arduino
}

/* ==========================
   INICIAR APLICACIÓN
========================== */
async function iniciarAplicacion() {

  boton.disabled = true;
  boton.innerText = "Nova Activada";

  estadoSistema.textContent = "Inicializando sistema...";

  await obtenerApiKey();

  estadoSistema.textContent = "Di: Nova + comando";

  hablar("Hola, soy Nova, tu asistente de voz. Estoy lista para recibir tus instrucciones. Recuerda comenzar cada comando diciendo mi nombre.");

  recognition.start();
}

boton.addEventListener("click", iniciarAplicacion);