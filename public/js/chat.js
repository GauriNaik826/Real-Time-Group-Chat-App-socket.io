const socket =io();
const autoscroll=()=>
{
  const $newmessage = $messages.lastElementChild
  const newmessageStyles = getComputedStyle($newmessage)
  const newmessageMargin = parseInt(newmessageStyles.marginBottom)
  const newmessageHeight = $newmessage.offsetHeight + newmessageMargin

  const visibleHeight = $messages.offsetHeight
  const containerHeight = $messages.scrollHeight
  const scrolloffset = $messages.scrollTop + visibleHeight
 // to know if we have scrolled to the bottom..so to make sure we are at the bottom
  if(containerHeight-newmessageHeight <= scrolloffset)
  {
    $messages.scrollTop = $messages.scrollHeight 

  }
}
//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')

// this is where we want to reder the messages
const $messages = document.querySelector('#messages')

//this will extract the username and room name from query string
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})



//Template
//this is how we want our template to be rendered, innertemplate will make us access p tag
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate =document.querySelector('#sidebar-template').innerHTML
socket.on('roomData',({room,users})=>{
  const html =Mustache.render(sidebarTemplate,{
    room,users
  })
  document.querySelector('#sidebar').innerHTML=html
})
socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
      message : message.text,
      createdAt  :moment (message.createdAt ).format('h:mm a'),
      username:message.username
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()

})

$messageForm.addEventListener("submit", e => {
    e.preventDefault();  
    $messageFormButton.setAttribute("disabled", "disabled");
  
    const message = e.target.elements.message.value;
  
    socket.emit("sendMessage", message, error => {
      $messageFormButton.removeAttribute("disabled");
      $messageFormInput.value = "";
      $messageFormInput.focus();
  
      if (error) {
        return console.log(error);
      } else {
        console.log("Message delivered!");
      }
    });
  });

  socket.on("locationMessage", message => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
     // username: message.username,
      url: message.url,
      createdAt: moment(message.createdAt).format("h:mm a")
    
    });
  
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll()
  });
 
 
  $sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
      return alert("Geolocation is not supported by your browser.");
    } else {
      $sendLocationButton.setAttribute("disabled", "disabled");
  
      navigator.geolocation.getCurrentPosition(position => {
        socket.emit(
          "sendLocation",
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          (error) => {
            $sendLocationButton.removeAttribute("disabled");
            if (!error) {
              console.log("Location shared!");
            }
          }
        );
      });
    }
  });
//comes from Qs.parse which parses the query string 
  socket.emit('join',{username,room} ,error => {
    if (error) {
      alert(error);// can use modal here
      location.href = "/";//if error then go back to home page
    }
  });
  