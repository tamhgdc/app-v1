const socket = io('https://chatapp-tuan.herokuapp.com',{
    withCredentials:true
})
// loading document page and socket io
const getAcc = async()=>{
    try{
     const token = localStorage.getItem('token')
     const response = await fetch('https://chatapp-tuan.herokuapp.com/api/accounts/authentication',{
         method:'GET',
         mode : 'cors',
         cache : 'no-cache',
         credentials :'same-origin',
         headers:{
             "Content-Type":"application/json",
             "x-token":token,
         },
         redirect:'follow',
         referrerPolicy:'no-referrer'
     })
     if(response.status === 400){
         location.href = '/index.html'
     }
     else{
        const acc = await response.json()
        return acc
     }
    } 

    catch(err){
        location.href = '/index.html'
    }
}
 
const getChatBoxs = async () => {
    try{
       const token = localStorage.getItem('token')
       const response =  await fetch('https://chatapp-tuan.herokuapp.com/api/chatBoxs',{
           method : 'GET',
            mode : 'cors',
            cache : 'no-cache',
            credentials : 'same-origin',
            redirect : 'follow',
            headers:{
               "Content-Type":"application/json",
               "x-token":token
            },
            referrerPolicy:'no-referrer'
       })
       if(response.status === 200){
            const arrChatBox = await response.json()
            var content = ''
            var arrPartner = []
            arrChatBox.forEach(res =>{
                content += `<li id="${res["_chatBox"]._id}" onclick="activeChatBox(this)">
                    <div class="d-flex bd-highlight">
                        <div class="img_cont">
                            <img src="https://res.cloudinary.com/anhtuanpham1507/image/upload/v1616603933/${res.avatar}" class="rounded-circle user_img">
                            <span class="online_icon offline"></span>
                        </div>
                        <div class="user_info">
                            <span>${res.name}</span>
                            <p>${res.name} is <span id="statusInfo">Offline</span></p>
                        </div>
                    </div>
                </li>`
                arrPartner.push(res._chatBox)
            })
            localStorage.setItem('chatBoxs',JSON.stringify(arrPartner))
            document.getElementById('groupChat').innerHTML = content
            socket.emit('new_connection',arrPartner)
       }
       else{
           const err = response.json()
           alert(err.message)
       }

    }
    catch(err){
        console.log(err)
    }
}

const getMessages = async (chatBox_ID) =>{
    const token = localStorage.getItem('token')
    const response = await fetch(`https://chatapp-tuan.herokuapp.com/api/messages?chatBox_ID=${chatBox_ID}`,{
        method:"GET",
        mode:"cors",
        cache :"no-cache",
        credentials:"same-origin",
        redirect:"follow",
        headers:{
            "Content-Type":"application/json",
            "x-token":token,
        },
        referrerPolicy:"no-referrer"
    })
    if(response.status === 200){
        const messages = await response.json()
        return Promise.resolve(messages)
    }
    else{
        const err = response.json()
        return Promise.reject(err.message)
    }
}

const check_login = async() =>{
    const account = await getAcc()
    const acc = {_id:account._id,name:account.name,avatar:account.avatar}
    localStorage.setItem('acc',JSON.stringify(acc))
    document.getElementById('account').innerText = `${account.name}`
    document.getElementById('user-avatar').setAttribute('src',`https://res.cloudinary.com/anhtuanpham1507/image/upload/v1616603933/${acc.avatar}`)
}

const writeMessages = (chatBox_ID) => {
    getMessages(chatBox_ID)
                .then(messages =>{
                    const partners = JSON.parse(localStorage.getItem('chatBoxs')).find(res => res._id == chatBox_ID)["accounts"]
                    const account= JSON.parse(localStorage.getItem('acc'))
                    messages.forEach(message => {
                        if(message.acc_ID == account._id)
                            if(message.type ==="text"){
                                create_my_message({message:message.content,time:message.createdAt,avatar:account.avatar})
                            }
                            else{
                                create_my_messageImage({image:message.content,time:message.createdAt,avatar:account.avatar})
                            }

                        else
                            partners.some(partner =>{
                                if(partner._id == message.acc_ID){
                                    if(message.type ==="text"){
                                        create_parter_message({message:message.content,time:message.createdAt,avatar:partner.avatar})
                                    }
                                    else{
                                        create_parter_messageImage({image:message.content,time:message.createdAt,avatar:partner.avatar})
                                    }
                                    return true
                                }
                            })
                    })
                })
                .catch(err=>{alert(err)})
}

const create_my_message = ({message,time,avatar}) => {
    const content =`
    <div class="d-flex justify-content-start mb-4">
        <div class="img_cont_msg">
            <img src="https://res.cloudinary.com/anhtuanpham1507/image/upload/v1616603933/${avatar}" class="rounded-circle user_img_msg">
        </div>
        <div class="msg_cotainer">
            ${message}
            <br>
            <span class="msg_time">${time}</span>
        </div>
     </div>`
    document.getElementById("main_chat").innerHTML += content
    document.getElementById("main_chat").scrollTo(0,document.getElementById("main_chat").scrollHeight)
}

const create_parter_message = ({message,time,avatar})=>{
    const content =`
    <div class="d-flex justify-content-end mb-4">
        <div class="img_cont_msg">
            <img src="https://res.cloudinary.com/anhtuanpham1507/image/upload/v1616603933/${avatar}" class="rounded-circle user_img_msg">
        </div>
        <div class="msg_cotainer_send">
            ${message}
            <br>
            <span class="msg_time_send"> ${time}</span>
        </div>
    </div>`
    document.getElementById("main_chat").innerHTML += content  
    document.getElementById("main_chat").scrollTo(0, document.getElementById("main_chat").scrollHeight)
}

const send_text = () => {
    const message = document.getElementById('Input-text').value
    const today = new Date()
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
    const account = JSON.parse(localStorage.getItem('acc'))
    const chatBoxID =  document.getElementsByClassName('active')[0].getAttribute("id")
    if (socket.emit("chat_message", {account,chatBoxID,message,time:today})) {
        create_my_message({message,time,avatar:account.avatar})
        document.getElementById('Input-text').value = ''
    }
}

const activeChatBox = (element) =>{
    const activeChatBox = document.getElementsByClassName('active')[0]
    if(activeChatBox != undefined)
        activeChatBox.classList.remove('active')
    element.classList.add('active')
    const name = element.querySelector(".user_info span").innerText
    const image = element.querySelector(".img_cont img").getAttribute("src")
    document.getElementById('nameChatting').innerText = name
    document.getElementById('imageChatting').setAttribute("src",image)
    document.getElementById("main_chat").innerHTML = ''
    writeMessages(element.getAttribute('id'))
}

const offlineChatBox = (ID) =>{
    document.querySelector(`[id="${ID}"] .img_cont span`).classList.add('offline')
    document.querySelector(`[id="${ID}"] #statusInfo`).innerText = "Offline"
}

socket.on('new_connection-user',(arr)=>{
    arr.forEach(res =>{
        document.querySelector(`[id="${res}"] .img_cont span`).classList.remove('offline')
        document.querySelector(`[id="${res}"] #statusInfo`).innerText = "Online"
    })
})

socket.on("chat_message-user",({message,time,avatar}) => {
    create_parter_message({message,time,avatar})
})

socket.on("disconnecting-user", ID => {
    offlineChatBox(ID)
})

check_login()
getChatBoxs()

// signaling video chat

const createVideoChat = () =>{
    const chatBox = document.getElementsByClassName('active')[0]
    if(chatBox.querySelector("#statusInfo").innerText !== "Offline"){
        const chatBoxID= chatBox.getAttribute('id')
        const name = document.getElementById('account').innerText
        const roomId = Math.random().toString(36).substr(2, 9)
        socket.emit('offerVideoChat',{chatBoxID,name,roomId})
        window.open(`/video.html?roomId=${roomId}`)
    }
    else
        alert("Đội tượng gọi đang không trực tuyến !!")
}


function doConfirm(msg, yesFn, noFn) {
    var confirmBox = $("#confirmBox")
    confirmBox.find(".message").text(msg)
    confirmBox.find(".yes,.no").unbind().click(function () {
        confirmBox.hide()
    })
    confirmBox.find(".yes").click(yesFn)
    confirmBox.find(".no").click(noFn)
    confirmBox.show()
}

socket.on('offerVideoChat-user',({name,roomId}) =>{
    const myName = document.getElementById('account').innerText
    doConfirm(`${name} đang gọi, bắt máy không ?`,
            /*yes*/ () => { window.open(`/video.html?roomId=${roomId}`)},
            /*no*/() =>{socket.emit('refuse',{roomId,name:myName})}
    )
})

socket.on('refuse-user',(name)=>{
    alert(`${name} đã từ chối chuộc gọi`)
})

//upload file 

const send_file = async()=>{
    const formData = new FormData(uploadForm)
        const chatBox_ID = document.getElementsByClassName('active')[0].getAttribute('id')
        formData.append("chatBox_ID",chatBox_ID)
        formData.append("type","file")
        const token = localStorage.getItem('token')
        const response = await fetch(uploadForm.action,{
            method:'post',
            headers:{
                "x-token":token
            },
            body: formData
        })
        if(response.status === 200){
            const message = await response.json()
            const acc = JSON.parse(localStorage.getItem('acc'))
            create_my_messageImage({image:message.content,time:message.createdAt,avatar:acc.avatar}) 
            socket.emit("image_upload", {avatar:acc.avatar,chatBoxID:message.chatBox_ID
                                        ,image:message.content,time:message.createdAt})
            del_uploadFile()
        }
}

const create_my_messageImage=({image,time,avatar})=>{
    const content =`
    <div class="d-flex justify-content-start mb-4">
        <div class="img_cont_msg">
            <img src="https://res.cloudinary.com/anhtuanpham1507/image/upload/v1616603933/${avatar}" class="rounded-circle user_img_msg">
        </div>
        <div class="image_cotainer_send">
            <img src="https://res.cloudinary.com/anhtuanpham1507/image/upload/v1616603933/${image}" alt="${image}" width="150" height="150"/>
            <br>
            <span class="msg_time_send"> ${time}</span>
        </div>
    </div>`
    document.getElementById("main_chat").innerHTML += content  
    document.getElementById("main_chat").scrollTo(0, document.getElementById("main_chat").scrollHeight)
}

const create_parter_messageImage = ({image,time,avatar})=>{
    const content =`
    <div class="d-flex justify-content-end mb-4">
        <div class="img_cont_msg">
            <img src="https://res.cloudinary.com/anhtuanpham1507/image/upload/v1616603933/${avatar}" class="rounded-circle user_img_msg">
        </div>
        <div class="image_cotainer_send">
            <img src="https://res.cloudinary.com/anhtuanpham1507/image/upload/v1616603933/${image}" alt="${image}" width="150" height="150"/>
            <br>
            <span class="msg_time_send"> ${time}</span>
        </div>
    </div>`
    document.getElementById("main_chat").innerHTML += content  
    document.getElementById("main_chat").scrollTo(0, document.getElementById("main_chat").scrollHeight)
} 
const sendmess = () =>{
    const text = document.getElementById('Input-text').value
    const file = document.getElementById('Input-file').value
    if(text!==''){ 
        send_text()
    }
    if(file!==''){
        send_file()
    }
}
var uploadForm = document.getElementById('uploadForm')
uploadForm.addEventListener("submit",async (e)=>{
    e.preventDefault()
    sendmess()
})

uploadForm.addEventListener("keydown",async (e)=>{
      if(e.keyCode === 13){
            e.preventDefault()
            sendmess()
      }
})


socket.on('image_upload-user',({image,time,avatar})=>{
    create_parter_messageImage({image,time,avatar})
})
document.getElementById("Input-file").addEventListener('change',e=>{
    const file = URL.createObjectURL(e.target.files[0])
    document.getElementById('container-file').innerHTML +=
    `<img class="uploading-image" src="${file}">
    <span class="delete_icon" onclick="del_uploadFile()">x</span>`
})

const del_uploadFile = () =>{
    document.getElementById('container-file').innerHTML=''
    document.getElementById('Input-file').value= ''
}

//log out
const logout = () =>{
    localStorage.clear();
    location.href="/index.html"
}








  
