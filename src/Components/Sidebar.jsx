import React, { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { Link } from "react-router-dom";

const Sidebar = ({ isCollapsed, isMobile }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleLogout = () => {
    localStorage.removeItem("mentorId");
    localStorage.removeItem("mentorName");
    alert("Logout successful");
    window.location.href = "/";
  };

  const elements = [
    {
      icon: <i className="ri-dashboard-fill text-white"></i>,
      name: "Dashboard",
      dropdown: [{ name: "Overview", path: "/dashboard" }],
    },
    {
      icon: <i className="ri-book-open-fill text-white"></i>,
      name: "Assigned Courses",
      dropdown: [{ name: "View Courses", path: "/mentorcourselist" }],
    },
    {
      icon: <i className="ri-book-open-fill text-white"></i>,
      name: "Assigned Enrollments",
      dropdown: [{ name: "View Enrollments", path: "/mentorenrollments" }],
    },
    {
      icon: <i className="ri-archive-fill text-white"></i>,
      name: "Batches",
      dropdown: [{ name: "View Batches", path: "/mentorbatchs" }],
    },
    {
      icon: <i className="ri-chat-3-fill text-white"></i>,
      name: "Chats",
      dropdown: [
        { name: "Chats", path: "/chats" },
      ],
    }
    ,
    {
      icon: <i className="ri-layout-fill text-white"></i>,
      name: "Classes",
      dropdown: [
        { name: "Create Live Classes", path: "/createliveclasses" },
        { name: "Live Classes", path: "/mentorliveclasses" },
        { name: "Upload Attendance", path: "/uploadattendance" },
        { name: "All Attendance", path: "/mentorgetattendance" },
      ],
    },
    {
      icon: <i className="ri-user-settings-fill text-white"></i>,
      name: "Profile",
      dropdown: [{ name: "View Profile", path: "/profile" }],
    },
    {
      icon: <i className="ri-logout-box-fill text-white"></i>,
      name: "Logout",
      dropdown: [{ name: "Logout", action: handleLogout }],
    },
  ];

  return (
    <div
      className={`transition-all duration-300 ${isMobile ? (isCollapsed ? "w-0" : "w-64") : isCollapsed ? "w-16" : "w-64"
        } h-screen overflow-y-scroll no-scrollbar flex flex-col bg-color`}
    >
      <div className="sticky top-0 p-4 font-bold text-white flex justify-center text-xl">
        <span>Mentor Panel</span>
      </div>
      <div className="border-b-4 border-gray-800 my-2"></div>

      <nav className={`flex flex-col ${isCollapsed && "items-center"} space-y-4 mt-4`}>
        {elements.map((item, idx) => (
          <div key={idx}>
            <div
              className="flex items-center py-3 px-4 font-semibold text-sm text-white mx-4 rounded-lg hover:bg-gray-700 hover:text-[#00B074] duration-300 cursor-pointer"
              onClick={() => toggleDropdown(item.name)}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`ml-4 ${isCollapsed && !isMobile ? "hidden" : "block"}`}>
                {item.name}
              </span>
              <FaChevronDown
                className={`ml-auto text-xs transform ${openDropdown === item.name ? "rotate-180" : "rotate-0"
                  }`}
              />
            </div>
            {openDropdown === item.name && (
              <ul className="ml-10 text-sm text-white space-y-1">
                {item.dropdown.map((subItem, subIdx) => (
                  <li key={subIdx}>
                    {subItem.path ? (
                      <Link
                        to={subItem.path}
                        className="flex items-center space-x-2 py-2 font-medium cursor-pointer hover:text-[#00B074] hover:underline"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <span className="text-[#00B074]">•</span>
                        <span>{subItem.name}</span>
                      </Link>
                    ) : (
                      <div
                        className="flex items-center space-x-2 py-2 font-medium cursor-pointer hover:text-[#00B074] hover:underline"
                        onClick={subItem.action}
                      >
                        <span className="text-[#00B074]">•</span>
                        <span>{subItem.name}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
