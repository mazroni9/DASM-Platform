"use client";

import React from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import '/public/assets/css/loading.scss';
import { ToastBar } from 'react-hot-toast';
import Snackbar from '@mui/material/Snackbar';
import Slide from '@mui/material/Slide';

export default function GlobalLoader() {
    const loadingContainerStyle = { 
      backgroundColor: "rgba(255, 255, 255, 0.3)", /* Semi-transparent background */
      backdropFilter: "blur(5px)", /* Apply blur to the background behind this element */
      //-webkit-backdrop-filter: blur(10px);
    }
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null;
  }

  // Generate random particle positions
  const particles = [...Array(20)].map((_, i) => ({
    key: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    // Base duration; will scale via inline style with CSS clamp
    duration: 2 + Math.random() * 2
  }));

  // const handleClose = (event, reason) => {
  //   if (reason === 'clickaway') {
  //     return;
  //   }

  //   setOpen(false);
  // };

  return (
    <>
    <Snackbar
    anchorOrigin={{vertical: 'bottom', horizontal: 'center' }}
    open={isLoading}
    slots={{ transition: Slide }}
    message={<div className='font-bold'>جار التحميل...</div>}
    
  />
  </>
    // <div style={loadingContainerStyle} className="fixed inset-0 z-50 flex items-center justify-center">
    //   {/* Animated Background */}
      
    //   <div className="loading-container absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
    //     <div className="absolute inset-0 bg-white opacity-0"></div> {/* Overlay opacity 0 */}

    //     {/* Floating particles */}
    //     <div className="absolute inset-0 overflow-hidden">
    //       {particles.map(p => (
    //         <div
    //           key={p.key}
    //           className="absolute rounded-full opacity-30 animate-pulse 
    //                      w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] md:w-[4px] md:h-[4px] bg-blue-300"
    //           style={{
    //             left: p.left,
    //             top: p.top,
    //             animationDelay: p.delay,
    //             // Scale duration: smaller screens slower, larger screens faster
    //             animationDuration: `clamp(${p.duration + 1}s, ${p.duration}s, ${p.duration - 0.5}s)`
    //           }}
    //         ></div>
    //       ))}
    //     </div>
    //   </div>

    //   {/* Main Loader Container */}
    //   <div className="relative z-10 flex flex-col items-center justify-center 
    //                    p-6 sm:p-8 md:p-12">
        
    //     {/* Premium Spinner */}
       
        
    //     {/* Premium Text */}
    //     <div className="text-center space-y-2">
    //       <div className="flex items-center justify-center gap-2">
    //         <svg className="car" width="102" height="40" xmlns="http://www.w3.org/2000/svg">
    //                 <g transform="translate(2 1)" stroke="#002742" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">
    //                   <path className="car__body" d="M47.293 2.375C52.927.792 54.017.805 54.017.805c2.613-.445 6.838-.337 9.42.237l8.381 1.863c2.59.576 6.164 2.606 7.98 4.531l6.348 6.732 6.245 1.877c3.098.508 5.609 3.431 5.609 6.507v4.206c0 .29-2.536 4.189-5.687 4.189H36.808c-2.655 0-4.34-2.1-3.688-4.67 0 0 3.71-19.944 14.173-23.902zM36.5 15.5h54.01" stroke-width="3"/>
    //                   <ellipse className="car__wheel--left" stroke-width="3.2" fill="#FFF" cx="83.493" cy="30.25" rx="6.922" ry="6.808"/>
    //                   <ellipse className="car__wheel--right" stroke-width="3.2" fill="#FFF" cx="46.511" cy="30.25" rx="6.922" ry="6.808"/>
    //                   <path className="car__line car__line--top" d="M22.5 16.5H2.475" stroke-width="3"/>
    //                   <path className="car__line car__line--middle" d="M20.5 23.5H.4755" stroke-width="3"/>
    //                   <path className="car__line car__line--bottom" d="M25.5 9.5h-19" stroke-width="3"/>
    //                 </g>
    //           </svg>
    //       </div>
    //       <h5 className=" font-bold text-gray-700 tracking-wide ">
    //         جارِ التحميل...          
    //       </h5>
    //      {/*  <p className="text-sm sm:text-base md:text-lg text-gray-500 font-medium">
    //         يرجى الانتظار قليلاً
    //       </p> */}
    //     </div>


     
    //   </div>
    // </div>
  );
}
