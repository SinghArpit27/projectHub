// toggle menu code

let menu = document.querySelector('#menu-bar');
let navbar = document.querySelector('.navbar');

menu.onclick = () =>{
    menu.classList.toggle('fa-times');
    navbar.classList.toggle('active');
}

window.onscroll = () =>{
    menu.classList.remove('fa-times');
    navbar.classList.remove('active');

}

document.querySelectorAll('.menu-btn').forEach
( link => {
    if(link.href === window.location.href){
        link.setAttribute('aria-current', 'page')
    }
});