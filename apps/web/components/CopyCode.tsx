'use client';
import {useState} from 'react';
export default function CopyCode({children,label='Copy'}:{children:string;label?:string}){
  const [copied,setCopied]=useState(false);
  async function copy(){try{await navigator.clipboard.writeText(children);setCopied(true);setTimeout(()=>setCopied(false),1400)}catch{}}
  return <div className="code-block"><button className="copy-btn" onClick={copy}>{copied?'Copied':label}</button><pre><code>{children}</code></pre></div>
}
