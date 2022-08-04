const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});



//login account
async function login(e){
    e.preventDefault()

    const email = document.getElementById('emailLogin').value
    const password = document.getElementById('passwordLogin').value
    const config ={
        method :'POST',
        mode :'cors',
        cache : 'no-cache',
        credentials: 'same-origin',
        headers:{
            'Content-Type':'application/json'
        },
        redirect:"follow",
        referrerPolicy: 'no-referrer',
        body:JSON.stringify({email,password})
    }

    const response = await fetch('https://chatapp-tuan.herokuapp.com/api/accounts/authentication',config)

    if(response.status !== 400){
        const token = await response.text();
        localStorage.setItem('token',token)
        location.href ='/chat.html'
    }
    else{
        const err = await response.json()
        alert(err.message)
    }
}
const formLogin = document.getElementById('formLogin')
formLogin.addEventListener('submit',login)
