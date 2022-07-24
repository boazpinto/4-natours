/* eslint-disable */
import '@babel/polyfill';
import { login,logout } from './login';
import { updateSettings } from './updateUser';

const loginForm = document.querySelector('.form--login');
const logOutBtn=document.querySelector('.nav__el--logout');
const saveSettingsForm=document.querySelector('.form-user-data');
const savePasswordForm=document.querySelector('.form-user-password');
const updatePasswordBtn=document.querySelector('.updatePassword')

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    e.preventDefault();
    login(email, password);
  });
}

if (logOutBtn) {
    logOutBtn.addEventListener('click', logout);
  }
if (saveSettingsForm) {
  saveSettingsForm.addEventListener('submit',(e)=>{
    e.preventDefault();

    const form=new FormData();
    form.append('name',document.getElementById('name').value);
    form.append('email',document.getElementById('email').value);
    form.append('photo',document.getElementById('photo').files[0]);
    updateSettings(form,'data');
  });
}

if (savePasswordForm) {
  savePasswordForm.addEventListener('submit',async (e)=>{
    e.preventDefault();
    const password = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;  
    const newPasswordConfirm = document.getElementById('password-confirm').value;  
       
    updatePasswordBtn.innerHTML='Updating...' 
    await updateSettings({password,newPassword,newPasswordConfirm},'password');
    updatePasswordBtn.innerHTML='Save password' 
    document.getElementById('password-current').value='';
    document.getElementById('password').value=''; 
    document.getElementById('password-confirm').value=''; 
  });
}
  
