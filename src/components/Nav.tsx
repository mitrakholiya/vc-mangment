"use client";
import Link from "next/link";
import React, { useState } from "react";

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  // const getToken = () => {
  //     const token = localStorage.getItem("token");
  //     return token;
  // }

  // const token = getToken();
  // const decoded = jwt.verify(token, process.env.JWT_SECRET!) as CustomJwtPayload;

  return (
    <>
      {/* Mobile Navbar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary/20 text-white">
        <button
          onClick={() => setIsOpen(true)}
          className="text-2xl"
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="w-full flex justify-between items-center">
          <h1 className="text-lg font-semibold">VC Management</h1>
          <Link
            href="/logout"
            className="text-gray-700 bg-white border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
          >
            Logout
          </Link>
        </div>
      </div>

      {/* Overlay + Sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        >
          {/* Sidebar */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="fixed top-0 left-0 h-full w-64 bg-surface shadow-xl z-50 transform transition-transform duration-300 translate-x-0"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-2xl"
                aria-label="Close menu"
              >
                &times;
              </button>
            </div>

            <nav className="flex flex-col p-4 space-y-4">
              {[
                { href: "/profile", label: "Dashboard" },
                { href: "/view-venture", label: "View VC" },
                // { href: "/join", label: "Join VC" },
                // { href: "/profile/get-loan", label: "Get Loan" },
                // { href: "/users", label: "Users" },
                // { href: "/login", label: "Login" },
                // { href: "/logout", label: "Logout" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="text-gray-700 hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Nav;
