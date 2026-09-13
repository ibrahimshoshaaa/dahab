"use client"
import { useEffect, useState } from "react"
import { X, Smartphone } from "lucide-react"
export default function PwaRegister(){
  const [prompt,setPrompt]=useState<any>(null)
  const [show,setShow]=useState(false)
  useEffect(()=>{
    if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{})
    const handler=(e:any)=>{e.preventDefault();setPrompt(e);setShow(true)}
    window.addEventListener("beforeinstallprompt",handler)
    return()=>window.removeEventListener("beforeinstallprompt",handler)
  },[])
  if(!show||!prompt) return null
  return <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-2xl" dir="rtl"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg)]"><Smartphone size={19}/></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">ثبّتي Dahab على موبايلك</p><p className="mt-1 text-xs text-gray-500">وصّلي للموقع أسرع من الشاشة الرئيسية.</p></div><button onClick={async()=>{await prompt.prompt();setPrompt(null);setShow(false)}} className="rounded-full bg-black px-4 py-2 text-xs text-white">تثبيت</button><button onClick={()=>setShow(false)} aria-label="إغلاق"><X size={18}/></button></div>
}
