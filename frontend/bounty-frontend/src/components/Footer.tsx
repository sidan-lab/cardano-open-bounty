import { MeshBadge } from "@meshsdk/react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 rounded-lg shadow m-4 p-4">
      <div className="w-full max-w-screen-xl mx-auto text-center py-6">
        <hr className="my-6 border-gray-700" />
        <div className="sm:flex sm:items-center sm:justify-between">
          <MeshBadge isDark={true} />
          <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-300 sm:mb-0 justify-center">
            {["About", "Privacy Policy", "Licensing", "Contact"].map(
              (linkName) => (
                <li key={linkName}>
                  <a
                    href="#"
                    className="hover:underline me-4 md:me-6 text-base transition-colors duration-200 hover:text-blue-500"
                  >
                    {linkName}
                  </a>
                </li>
              )
            )}
          </ul>
        </div>
        <hr className="my-6 border-gray-700" />
        <span className="block text-sm text-gray-300">
          © 2025 Delta Lab Limited. All Rights Reserved.
        </span>
      </div>
    </footer>
  );
};
export default Footer;
