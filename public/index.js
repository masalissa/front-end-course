let all = document.getElementById("all")
let selected = document.getElementById("selected")
let selectArea = document.getElementById("selectArea")

all.addEventListener("click",()=>{
    
if(all.checked == true){
    selectArea.disabled = true
} 
})

selected.addEventListener("click",()=>{
if(selected.checked == true){
    selectArea.disabled = false
}
})
