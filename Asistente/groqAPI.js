document.addEventListener("DOMContentLoaded", function() {
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const tupreguntasteElement = document.getElementById('tupreguntaste');
  const preguntaElement = document.getElementById('pregunta');
  const respuestaElement = document.getElementById('respuesta');
  const responseElement = document.getElementById('response');
  const fechaYHora = new Date().toString();
  let ip_user;
  let TOKEN;
  let API_URL;
  let API_IP;

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', enterEvent);

  fetch('../includes/getEnv.php')
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
    const message = messageInput.value;
    if(message !== ""){
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        messages: [{
          "role": "user",
          "content": message
        }],
        model: "llama3-70b-8192"
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error de red: ' + response.status);
      }
      return response.json();
    })  
    .then(data => {
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
      responseElement.innerHTML = contentFormat;
      }else{
        contentFormat = content.replace(/\n\n/g, '<br><br>'); //agregamos espaciado que sale mal
        content = contentFormat.replace(/\n/g, '<br><br>'); //agregamos espaciado que sale mal tambien
        contentFormat = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); //cambiamos texto entre ** a negritas 
        responseElement.innerHTML = contentFormat;
      }
 
      tupreguntasteElement.innerText = "Tu preguntaste:";
      preguntaElement.innerText = message;
      respuestaElement.innerText = "Respuesta:";
      messageInput.value = "";
      dataBase(message);
    })
    .catch(error => {
      console.error('Error al realizar la solicitud:', error);
      responseElement.innerText = error.message;
    });    
    }
  }

  function dataBase(message){
    fetch('Asistente/guardar_consulta.php', {
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
      console.log(data);
    })
  }

  function enterEvent(event) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  }
  
});