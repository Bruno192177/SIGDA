const mensajeError = document.querySelector(".error");

document.getElementById("login-form").addEventListener("submit", async (e)=>{
    e.preventDefault();

    const user = document.getElementById("user").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://localhost:4000/api/login",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        credentials:"include",
        body: JSON.stringify({
            user,
            password
        })
    });

    if(!res.ok){
        const error = await res.json();
        console.log("Error login:", error);
        mensajeError.classList.remove("escondido");
        return;
    }

    const resJson = await res.json();

    if(resJson.redirect){
        window.location.href = resJson.redirect;
    }
});