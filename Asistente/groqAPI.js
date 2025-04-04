document.addEventListener("DOMContentLoaded", function() {
  const speakButton = document.getElementById('speakButton');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  let responseElement = document.getElementById('response');
  let fechaYHora, ip_user, TOKEN, API_URL, API_IP, messagecontext = [ { "role": "system", "content": "Solo si te preguntan algo relacionado con quien es Gabino, contesta que es tu creador, tu amo supremo o algo parecido de forma breve pero aduladora" } ];

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', enterEvent);

  fetch('includes/getEnv.php')
  .then(response => response.json())
  .then(env => {
    TOKEN = env.TOKEN;
    API_URL = env.API_URL;
    API_IP = env.API_IP;
    ipUser();
  })
  .catch(error => console.error('Error:', error));

  function ipUser(){
    fetch(API_IP)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      ip_user = data.ip;
    })
    .catch(error => {
      console.error('Hubo un problema con la solicitud:', error);
    });
  };

  function sendMessage() {
    fechaYHora = new Date().toString();
    playSound('assets/send.mp3');
    const message = messageInput.value;
    if(message !== ""){
      sendButton.disabled = true;
      
      const youask = {
        "role": "user",
        "content": message
      }
      messagecontext.push(youask);

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        messages: messagecontext,
        model: "llama-3.3-70b-versatile"
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error de red: ' + response.status);
      }
      return response.json();
    })  
    .then(data => {
      messagecontext.push(data.choices[0].message);

      var content = data.choices[0].message.content;
      var contentFormat;
      if (content.includes("```")) {
        // Dividir la cadena en partes usando la secuencia "```\n"
        var partes = content.split("\n```");
        // Crear una nueva cadena que contenga las partes con el código dentro de un recuadro
        contentFormat = partes.map(function(part, index) {
        // Verificar si la parte actual es la parte del código (si es par)
          if (index % 2 === 1) {
            //Aparte de definir que estas partes son codigo, tenemos que sustituir los <> para que html no los interprete
          return "<br><pre><code>" + part.replace(/</g, '&lt;').replace(/>/g, '&gt;') + "</code></pre>";
          } else {
          return part.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br><br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
          }
        }).join("");

        addNewParagraph(contentFormat, message);

      }else{
        contentFormat = content.replace(/\n\n/g, '<br><br>'); //agregamos espaciado que sale mal
        content = contentFormat.replace(/\n/g, '<br><br>'); //agregamos espaciado que sale mal tambien
        contentFormat = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); //cambiamos texto entre ** a negritas 

        addNewParagraph(contentFormat, message);

      }
 
      messageInput.value = "";
      dataBase(message);
      sendButton.disabled = false;
    })
    .catch(error => {
      console.error('Error al realizar la solicitud:', error);
      responseElement.innerText = error.message;
      sendButton.disabled = false;
    });    
    }
  }

  function dataBase(message){
    fetch('asistente/guardar_consulta.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        pregunta: message,
        fecha: fechaYHora,
        ip: ip_user
      })
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Error de red: ' + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      console.log ("Captura correcta!");
      // Aquí puedes manejar la respuesta si es necesario
    })
  }

  function enterEvent(event) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  }


// Función para agregar un nuevo párrafo
function addNewParagraph(content, msj) {
    // Crear un nuevo párrafo
    const newParagraph = document.createElement('p');
    newParagraph.className = 'response';
    newParagraph.innerHTML = "<div class='response_container'><p class='h22'>Tu preguntaste:</p><br>" + msj + "<br><p class='h22'>Respuesta:</p><br>" + content + "<br><br><div>";

    // Insertar el nuevo párrafo antes del primer párrafo existente
    responseElement.insertAdjacentElement('beforebegin', newParagraph);

    // Actualizar la referencia al primer párrafo existente
    responseElement = newParagraph;
}


// Comprobamos si el navegador soporta el reconocimiento de voz
// webkitSpeechRecognition para navegadores basados en WebKit (Chrome, safari),
// SpeechRecognition para otros navegadores
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const reconocimientoVoz = new SpeechRecognition();

  // Configuración del reconocimiento de voz
  reconocimientoVoz.continuous = false; //el reconocimiento termina con pausas prolongadas
  reconocimientoVoz.lang = 'es-ES';

  // Evento cuando se detecta voz
  reconocimientoVoz.onresult = function(event) {
      const resultado = event.results[0][0].transcript;
      messageInput.value = resultado;
      sendMessage();
  };

  // Evento cuando se presiona el botón
  speakButton.addEventListener('click', function() {
    playSound('assets/start_recording.mp3');
    reconocimientoVoz.start();
    speakButton.disabled = true;
  });

  // Evento cuando finaliza la grabación
  reconocimientoVoz.onend = function() {
    // Sonido al finalizar la grabación
    playSound('assets/stop_recording.mp3');
    speakButton.disabled = false;
  };

  // Evento de error
  reconocimientoVoz.onerror = function(event) {
    console.error('Error en el reconocimiento de voz:', event.error);
    // Puedes mostrar un mensaje de error al usuario o manejar la situación de otra manera
    alert('Error - El navegador ha bloqueado el microfono. Intenta con un navegador diferente.');
    speakButton.disabled = false; // Habilita el botón después del error
    };
    
} else {
  alert('Tu navegador no soporta el reconocimiento de voz.');
}

// Función para reproducir sonidos
function playSound(soundFile) {
  const audio = new Audio(soundFile);
  audio.play();
}


});