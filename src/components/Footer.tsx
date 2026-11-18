import { Link } from 'react-router-dom';
import { BrandMark } from './BrandMark';

export function Footer({ darkSurface = false }: { darkSurface?: boolean }) {
  return (
    <footer
      className={`${
        darkSurface
          ? 'bg-[#070908] text-[#F8F6F0] border-t border-white/10'
          : 'bg-[#123D3A] text-[#F8F6F0] border-t border-[#1D524E]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/15">
          <div className="md:col-span-5 space-y-3">
            <BrandMark light />
            <p className="text-sm sm:text-[15px] text-[#F8F6F0]/82 max-w-sm leading-relaxed">
              Travel smarter. Explore deeper. Stay informed. Ground-level travel intelligence for Indian travellers.
            </p>
            <p className="text-sm text-[#8CC9E8]">
              Know what to expect at a destination before you reach it — not just where to go.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="eyebrow-mono font-semibold text-[#E9A34A]">CORE CAPABILITIES</h3>
            <ul className="space-y-2.5 text-sm text-[#F8F6F0]/85">
              <li>
                <Link to="/travel-assist" className="hover:text-white transition-colors inline-block py-0.5">
                  01. Travel Assist
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-white transition-colors inline-block py-0.5">
                  02. Explore & Plan
                </Link>
              </li>
              <li>
                <Link to="/stay-reality" className="hover:text-white transition-colors inline-block py-0.5">
                  03. Stay Reality
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="eyebrow-mono font-semibold text-[#E9A34A]">FEATURED DESTINATIONS</h3>
            <ul className="grid grid-cols-2 gap-2.5 text-sm text-[#F8F6F0]/85">
              <li>
                <Link to="/explore?dest=udaipur" className="hover:text-white transition-colors inline-block py-0.5">
                  Udaipur
                </Link>
              </li>
              <li>
                <Link to="/explore?dest=jaipur" className="hover:text-white transition-colors inline-block py-0.5">
                  Jaipur
                </Link>
              </li>
              <li>
                <Link to="/explore?dest=rishikesh" className="hover:text-white transition-colors inline-block py-0.5">
                  Rishikesh
                </Link>
              </li>
              <li>
                <Link to="/explore?dest=manali" className="hover:text-white transition-colors inline-block py-0.5">
                  Manali & Bir
                </Link>
              </li>
              <li>
                <Link to="/explore?dest=alleppey" className="hover:text-white transition-colors inline-block py-0.5">
                  Alleppey
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-[#F8F6F0]/75">
          <p>© {new Date().getFullYear()} Yatra Saathi. Ground-Level Travel Intelligence.</p>
          <p>
            Live weather via Open-Meteo · Maps &amp; routing powered by Google Maps Platform where configured.
          </p>
        </div>
      </div>
    </footer>
  );
}
