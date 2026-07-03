import type { SVGProps } from "react";

export const SPACE_AVATARS = [
  {
    id: "1",
    bg: "bg-purple-500", // Parrot
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2V22Z"
          fill="#00C7E6"
        />
        <path
          d="M12 2C17.5228 2 22 6.47715 22 12C22 16 19 18 19 18C19 18 19 12 12 12V2Z"
          fill="#FFC400"
        />
        <circle cx="8" cy="10" r="2" fill="#172B4D" />
      </svg>
    ),
  },
  {
    id: "2",
    bg: "bg-blue-500", // Cloud
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M7 16.5C4.51472 16.5 2.5 14.4853 2.5 12C2.5 9.77123 4.12078 7.92003 6.24151 7.55173C6.70327 4.96576 8.95679 3 11.6667 3C14.0722 3 16.149 4.54228 16.9205 6.64332C19.7214 6.84074 21.9167 9.17647 21.9167 12C21.9167 14.4853 19.9019 16.5 17.4167 16.5H7Z"
          fill="#FFFFFF"
        />
        <circle cx="10" cy="11" r="1" fill="#172B4D" />
        <circle cx="14" cy="11" r="1" fill="#172B4D" />
        <path
          d="M11 13C11.5 13.5 12.5 13.5 13 13"
          stroke="#FF5630"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="9" cy="12.5" r="1" fill="#FF8F73" />
        <circle cx="15" cy="12.5" r="1" fill="#FF8F73" />
      </svg>
    ),
  },
  {
    id: "3",
    bg: "bg-orange-500", // Disc
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <circle cx="12" cy="12" r="9" fill="#172B4D" />
        <circle cx="12" cy="12" r="4" fill="#00B8D9" />
        <circle cx="12" cy="12" r="1.5" fill="#6554C0" />
        <path
          d="M6 6L3 3M18 18L21 21M6 18L3 21M18 6L21 3"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "4",
    bg: "bg-orange-500", // Browser
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <rect x="3" y="4" width="18" height="16" rx="2" fill="#172B4D" />
        <path
          d="M3 6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V8H3V6Z"
          fill="#DFE1E6"
        />
        <circle cx="5.5" cy="6" r="1" fill="#FF5630" />
        <circle cx="8" cy="6" r="1" fill="#FFAB00" />
        <circle cx="10.5" cy="6" r="1" fill="#00B8D9" />
        <rect x="5" y="11" width="8" height="2" rx="1" fill="#FFFFFF" />
        <rect x="14" y="11" width="4" height="2" rx="1" fill="#0052CC" />
        <rect x="5" y="14" width="6" height="2" rx="1" fill="#FF5630" />
        <rect x="12" y="14" width="6" height="2" rx="1" fill="#00B8D9" />
      </svg>
    ),
  },
  {
    id: "5",
    bg: "bg-green-500", // Mountain
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d="M12 4L2 20H22L12 4Z" fill="#172B4D" />
        <path d="M12 4L2 20H12V4Z" fill="#0052CC" />
        <path d="M12 4L7 12H17L12 4Z" fill="#FFFFFF" />
        <path d="M12 4L7 12H12V4Z" fill="#DFE1E6" />
      </svg>
    ),
  },
  {
    id: "6",
    bg: "bg-cyan-500", // Coffee
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M17 9V14C17 17.3137 14.3137 20 11 20H9C5.68629 20 3 17.3137 3 14V9H17Z"
          fill="#172B4D"
        />
        <path
          d="M17 11H19C20.1046 11 21 11.8954 21 13C21 14.1046 20.1046 15 19 15H17"
          stroke="#172B4D"
          strokeWidth="2"
        />
        <rect x="3" y="6" width="14" height="3" rx="1" fill="#0052CC" />
        <path
          d="M7 2V4M10 2V4M13 2V4"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "7",
    bg: "bg-yellow-400", // Rocket
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M11 2C11 2 4 4 4 12C4 16 2 20 2 20L5.5 18.5L9 22L10.5 18.5C10.5 18.5 14.5 18 17 14C19.5 10 20 3 20 3C20 3 13 3.5 11 2Z"
          fill="#FF5630"
        />
        <path
          d="M11 2C11 2 4 4 4 12C4 16 5.5 18.5 5.5 18.5L10.5 13.5C10.5 13.5 14.5 18 17 14C19.5 10 20 3 20 3C20 3 13 3.5 11 2Z"
          fill="#172B4D"
        />
        <circle cx="14" cy="8" r="2" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: "8",
    bg: "bg-purple-500", // Telescope
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d="M4 18L10 12L20 22L4 18Z" fill="#00B8D9" />
        <path d="M22 6L16 12L6 2L22 6Z" fill="#FF5630" />
        <path d="M16 12L10 12L16 6L16 12Z" fill="#FFC400" />
        <circle cx="13" cy="9" r="1.5" fill="#172B4D" />
      </svg>
    ),
  },
  {
    id: "9",
    bg: "bg-red-500", // Shield
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6L12 2Z"
          fill="#172B4D"
        />
        <path d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23V2Z" fill="#00B8D9" />
        <path
          d="M12 8V14M9 11H15"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "10",
    bg: "bg-blue-500", // Map
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M9 4L3 7V21L9 18M9 4L15 7M9 4V18M15 7L21 4V18L15 21M15 7V21M9 18L15 21"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2" fill="#FF5630" />
        <path
          d="M12 12V15"
          stroke="#FF5630"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "11",
    bg: "bg-emerald-500", // Ghost
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M4 22V10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10V22L17.3333 19L14.6667 22L12 19L9.33333 22L6.66667 19L4 22Z"
          fill="#FFFFFF"
        />
        <circle cx="9" cy="10" r="1.5" fill="#172B4D" />
        <circle cx="15" cy="10" r="1.5" fill="#172B4D" />
        <circle cx="12" cy="14" r="1.5" fill="#FF8F73" />
      </svg>
    ),
  },
  {
    id: "12",
    bg: "bg-teal-500", // Paint
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M12 2L12 14"
          stroke="#172B4D"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M6 14H18C19.1046 14 20 14.8954 20 16V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V16C4 14.8954 4.89543 14 6 14Z"
          fill="#FFC400"
        />
        <path d="M4 18H20" stroke="#172B4D" strokeWidth="2" />
        <path
          d="M12 22V24"
          stroke="#FFC400"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "13",
    bg: "bg-indigo-500", // Gamepad
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <rect x="2" y="6" width="20" height="12" rx="6" fill="#172B4D" />
        <circle cx="17" cy="10" r="1.5" fill="#36B37E" />
        <circle cx="15" cy="14" r="1.5" fill="#00B8D9" />
        <path
          d="M6 12H10M8 10V14"
          stroke="#FF5630"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "14",
    bg: "bg-pink-500", // Crown
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d="M3 20H21V22H3V20Z" fill="#172B4D" />
        <path d="M3 18L5 6L12 12L19 6L21 18H3Z" fill="#FFC400" />
        <circle cx="5" cy="5" r="1.5" fill="#FF5630" />
        <circle cx="12" cy="11" r="1.5" fill="#0052CC" />
        <circle cx="19" cy="5" r="1.5" fill="#FF5630" />
      </svg>
    ),
  },
  {
    id: "15",
    bg: "bg-rose-500", // Heart
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
          fill="#FFFFFF"
        />
        <path
          d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09V21.35Z"
          fill="#FFC400"
        />
      </svg>
    ),
  },
  {
    id: "16",
    bg: "bg-blue-600", // Fish
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d="M12 12C12 7 16 3 22 3C22 9 18 13 12 12Z" fill="#FF5630" />
        <path d="M22 21C22 15 18 11 12 12C12 17 16 21 22 21Z" fill="#00B8D9" />
        <path d="M12 12L2 6V18L12 12Z" fill="#FFC400" />
        <circle cx="17" cy="12" r="1" fill="#172B4D" />
      </svg>
    ),
  },
  {
    id: "17",
    bg: "bg-lime-500", // Leaf
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M12 2C12 2 4 6 4 14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14C20 6 12 2 12 2Z"
          fill="#0052CC"
        />
        <path
          d="M12 2C12 2 4 6 4 14C4 18.4183 7.58172 22 12 22V2Z"
          fill="#00B8D9"
        />
        <path
          d="M12 22V12M12 15L8 12M12 18L16 15"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "18",
    bg: "bg-cyan-600", // Flag
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M4 22V2M4 2L18 6L14 10L18 14L4 18"
          stroke="#172B4D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M4 2L18 6L14 10L18 14L4 18V2Z" fill="#FF5630" />
        <path d="M4 2L18 6L14 10H4V2Z" fill="#FFC400" />
      </svg>
    ),
  },
  {
    id: "19",
    bg: "bg-fuchsia-500", // Compass
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <circle cx="12" cy="12" r="9" fill="#FFFFFF" />
        <circle cx="12" cy="12" r="6" fill="#DFE1E6" />
        <path d="M12 6L14 12L12 18L10 12L12 6Z" fill="#FF5630" />
        <path d="M12 6L14 12L12 12L12 6Z" fill="#172B4D" />
        <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: "20",
    bg: "bg-purple-700", // Moon
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
          fill="#FFC400"
        />
        <circle cx="8" cy="10" r="1.5" fill="#FF8B00" />
        <circle cx="12" cy="16" r="2" fill="#FF8B00" />
      </svg>
    ),
  },
  {
    id: "21",
    bg: "bg-red-600", // Key
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M14 10L20 4M20 4V8M20 4H16"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="15" r="5" fill="#FFC400" />
        <circle cx="9" cy="15" r="2" fill="#172B4D" />
      </svg>
    ),
  },
  {
    id: "22",
    bg: "bg-blue-400", // Book
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20V3H6.5C5.11929 3 4 4.11929 4 5.5V19.5Z"
          fill="#FFFFFF"
        />
        <path
          d="M4 19.5C4 20.8807 5.11929 22 6.5 22H20V17H6.5C5.11929 17 4 18.1193 4 19.5Z"
          fill="#172B4D"
        />
        <rect x="8" y="6" width="8" height="2" rx="1" fill="#FF5630" />
        <rect x="8" y="10" width="6" height="2" rx="1" fill="#DFE1E6" />
      </svg>
    ),
  },
  {
    id: "23",
    bg: "bg-green-600", // Puzzle
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M14.99 15.02L18.99 15.02C18.99 15.02 20.99 15 20.99 11.02C20.99 7.03998 18.99 7.01998 18.99 7.01998L14.99 7.01998L14.99 3.01998C14.99 3.01998 14.98 1.01998 10.99 1.01998C7.00001 1.01998 6.99001 3.01998 6.99001 3.01998L6.99001 7.01998L3.00001 7.01998C3.00001 7.01998 1.00001 7.03998 1.00001 11.02C1.00001 15 3.00001 15.02 3.00001 15.02L6.99001 15.02L6.99001 19.02C6.99001 19.02 6.98001 21.02 10.99 21.02C15 21.02 14.99 19.02 14.99 19.02L14.99 15.02Z"
          fill="#FFC400"
        />
        <circle cx="11" cy="11" r="2.5" fill="#172B4D" />
      </svg>
    ),
  },
  {
    id: "24",
    bg: "bg-cyan-700", // Magnet
    text: "text-white",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M4 10V14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14V10"
          stroke="#172B4D"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <rect x="4" y="2" width="4" height="8" rx="1" fill="#FF5630" />
        <rect x="16" y="2" width="4" height="8" rx="1" fill="#0052CC" />
        <rect x="4" y="2" width="4" height="3" fill="#DFE1E6" />
        <rect x="16" y="2" width="4" height="3" fill="#DFE1E6" />
      </svg>
    ),
  },
];

export function getSpaceAvatar(id?: string) {
  return SPACE_AVATARS.find((a) => a.id === id) || SPACE_AVATARS[0];
}
