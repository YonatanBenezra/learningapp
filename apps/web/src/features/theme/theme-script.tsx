/** LabPath uses dark theme only — no light / system toggle. */
export const themeInitScript = `(function(){try{var r=document.documentElement;r.setAttribute("data-theme","dark");r.classList.add("dark");localStorage.setItem("labpath-theme","dark");}catch(e){}})();`;
