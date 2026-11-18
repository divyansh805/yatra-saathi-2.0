import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, LogOut, Route, Trash2, User, Wifi, WifiOff } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SafeImage } from '../components/SafeImage';
import { Reveal, RevealGroup, RevealItem } from '../components/Reveal';
import { MotionCard } from '../components/MotionCard';
import { useApp } from '../contexts/AppContext';

export function ProfilePage() {
  const {
    user,
    savedItems,
    savedRoutes,
    isOnline,
    offlineCachedAt,
    toggleSaveItem,
    deleteSavedRoute,
    logout,
  } = useApp();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F6F0]">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
          <Reveal immediate>
            <User className="w-10 h-10 text-[#123D3A] mx-auto mb-4" />
            <h1 className="font-editorial text-3xl font-semibold text-[#123D3A]">
              Sign in to view your travel profile
            </h1>
            <p className="text-sm text-[#5A6664] mt-3">
              Your saved attractions, solo cafes, adventures, stays, and offline-ready routes live here.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <Link
                to="/login"
                className="px-5 py-2.5 min-h-[44px] inline-flex items-center rounded-lg bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 min-h-[44px] inline-flex items-center rounded-lg border border-[#D7CFC1] bg-white text-[#123D3A] text-sm font-semibold hover:bg-[#EFECE3] transition-colors"
              >
                Create Account
              </Link>
            </div>
          </Reveal>
        </main>
        <Footer />
      </div>
    );
  }

  const attractions = savedItems.filter((i) => i.type === 'attraction');
  const cafes = savedItems.filter((i) => i.type === 'cafe');
  const adventures = savedItems.filter((i) => i.type === 'adventure');
  const stays = savedItems.filter((i) => i.type === 'stay');

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#142322]">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Account Header */}
        <Reveal immediate>
          <section className="bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#123D3A] text-white font-editorial text-2xl font-semibold flex items-center justify-center shrink-0">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#123D3A]">
                  {user.name}
                </h1>
                <p className="text-sm text-[#5A6664]">{user.email}</p>
                <p className="text-sm text-[#5A6664] mt-1">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2.5 rounded-lg bg-[#F8F6F0] border border-[#E5DFD3] text-[#123D3A]">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-700" aria-hidden="true" />
                )}
                {isOnline
                  ? offlineCachedAt
                    ? `Synced · Cached ${new Date(offlineCachedAt).toLocaleTimeString()}`
                    : 'Online'
                  : `Offline · Cached ${offlineCachedAt ? new Date(offlineCachedAt).toLocaleString() : 'snapshot'}`}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Log Out
              </button>
            </div>
          </section>
        </Reveal>

        {/* Saved Routes */}
        <Reveal>
          <section className="space-y-4">
            <h2 className="font-editorial text-2xl font-semibold text-[#123D3A] flex items-center gap-2">
              <Route className="w-5 h-5 text-[#E9A34A]" aria-hidden="true" />
              Saved Routes & Travel Plans ({savedRoutes.length})
            </h2>

            {savedRoutes.length === 0 ? (
              <div className="bg-white border border-[#E5DFD3] rounded-xl p-6 text-sm text-[#5A6664] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span>No routes saved yet. Sequence stops in Explore & Plan to save them for offline access.</span>
                <Link
                  to="/explore"
                  className="px-4 py-2.5 min-h-[42px] inline-flex items-center rounded-lg bg-[#123D3A] text-white text-sm font-semibold hover:bg-[#194E4A] transition-colors shrink-0"
                >
                  Plan a Route
                </Link>
              </div>
            ) : (
              <RevealGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedRoutes.map((route) => (
                  <RevealItem key={route.id}>
                    <MotionCard className="bg-white border border-[#E5DFD3] rounded-xl p-5 space-y-3 h-full flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-editorial text-xl font-semibold text-[#123D3A]">
                              {route.destinationName}
                            </h3>
                            <p className="text-sm text-[#5A6664]">
                              Pickup: {route.pickupLabel} · Saved {new Date(route.savedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteSavedRoute(route.id)}
                            aria-label={`Delete route for ${route.destinationName}`}
                            className="p-2 rounded-lg text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <ol className="space-y-1 text-sm text-[#394543] list-decimal list-inside">
                          {route.stops.map((stop) => (
                            <li key={stop.id}>{stop.name}</li>
                          ))}
                        </ol>
                      </div>

                      <div className="pt-3 border-t border-[#E5DFD3] flex items-center justify-between text-sm text-[#5A6664]">
                        <span className="font-mono">
                          {route.totalDistanceKm ? `${route.totalDistanceKm} km` : 'Order saved'}
                          {route.estimatedTransportInr ? ` · Auto est. ₹${route.estimatedTransportInr}` : ''}
                        </span>
                        <Link
                          to={`/explore?dest=${route.destinationId}`}
                          className="font-semibold text-[#123D3A] hover:underline"
                        >
                          Open in planner
                        </Link>
                      </div>
                    </MotionCard>
                  </RevealItem>
                ))}
              </RevealGroup>
            )}
          </section>
        </Reveal>

        {/* Categorized Saved Places */}
        {[
          { title: 'Saved Attractions', items: attractions, empty: 'No saved attractions yet.' },
          { title: 'Saved Cafes', items: cafes, empty: 'No saved cafes yet.' },
          { title: 'Saved Adventures', items: adventures, empty: 'No saved adventures yet.' },
          { title: 'Saved Stays', items: stays, empty: 'No saved stays yet.' },
        ].map((group) => (
          <Reveal key={group.title}>
            <section className="space-y-4">
              <h2 className="font-editorial text-2xl font-semibold text-[#123D3A] flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#E9A34A]" aria-hidden="true" />
                {group.title} ({group.items.length})
              </h2>

              {group.items.length === 0 ? (
                <p className="bg-white border border-[#E5DFD3] rounded-xl p-5 text-sm text-[#5A6664]">
                  {group.empty}
                </p>
              ) : (
                <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.items.map((item) => {
                    const detailLink =
                      item.type === 'stay'
                        ? `/stay-reality/${item.id}`
                        : `/explore/${item.type}/${item.id}?dest=${item.destinationId}`;
                    return (
                      <RevealItem key={`${item.type}-${item.id}`}>
                        <MotionCard className="group bg-white border border-[#E5DFD3] rounded-xl overflow-hidden flex flex-col h-full">
                          <Link to={detailLink} className="aspect-[16/10] bg-[#EAE4D7] block overflow-hidden">
                            <SafeImage
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                            />
                          </Link>
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <Link
                                to={detailLink}
                                className="font-editorial text-lg font-semibold text-[#123D3A] hover:text-[#E9A34A] transition-colors"
                              >
                                {item.title}
                              </Link>
                              <p className="text-sm text-[#5A6664] mt-0.5">{item.subtitle}</p>
                              {item.cachedSummary && (
                                <p className="text-sm text-[#495553] mt-2 line-clamp-2">
                                  {item.cachedSummary}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-2.5 border-t border-[#E5DFD3] text-sm">
                              <span className="text-[#5A6664]">
                                Cached {new Date(item.savedAt).toLocaleDateString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleSaveItem(item)}
                                className="text-red-700 font-medium hover:underline py-1 px-2 rounded cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </MotionCard>
                      </RevealItem>
                    );
                  })}
                </RevealGroup>
              )}
            </section>
          </Reveal>
        ))}
      </main>

      <Footer />
    </div>
  );
}
