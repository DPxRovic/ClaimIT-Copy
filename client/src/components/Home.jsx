import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import ItemCard from './ItemCard.jsx';
import { fetchRecentlyReported, fetchRecentlyResolved } from '../firebase/reports.js';
import { BrowseItemDetailsModal } from './BrowseItemDetailsModal.jsx';

const DEFAULT_RECENTLY_REPORTED = [
  {
    id: 'airpods-pro-2',
    title: 'Apple AirPods Pro (2nd Gen)',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Active',
    date: 'Sept 09, 2026',
    location: 'Congress Campus - Library',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBC_O6MmcQqb46ZGcyzeTfXUwjVOrcA7pt-7KkZ4WHcZdRPV7BZmYaaYd6mtsib7Sc6PZVjQGxu46ep5UehnPK10IavovbjmraJxe04mEOIPuQmCE6uPsEjssyArCGewkghdRPgbVII2ykI6a_n-9lkrEE458d3HGJAYOwGIOtU_Stv4dDE5uLL3YiKWreMnUdg1N5-VsDRVQPLfWys_sSuTWOJE7hyn7CaBvbVjRoC1oS9ZdKzcIJSUQ',
    imageAlt: 'Apple AirPods Pro second generation with case resting on cloth surface.',
  },
  {
    id: 'hydro-flask-32oz',
    title: 'Hydro Flask 32oz Navy',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 24, 2025',
    location: 'Science Hall 104',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6tWbpguWrLQHmnQ5US7mPJsyaDaf1i1EtLNKM3N4SjSDL3GLeAwfJpAysAbXwT298AAVjM2m92xTZLqKMma1MaheYWENk6gglSc7ijOOAUY-CpIzLOk8NTedsZf2NX86uhT8oxy3k-Ar1RGkKAm53vMmMzRFNogKRF36lolbxkc8r4yKOkyHKeBvsvI0F73tb1EZTitfZPqBU57cGYthS87ANF3LRCHEsYKW2HZFk6zd_PQiX1-8g8w',
    imageAlt: 'Hydro Flask bottle next to climbing rope and carabiners outdoors.',
  },
  {
    id: 'keys-campus-lanyard',
    title: 'Keys with Red Campus Lanyard',
    category: 'KEYS & ACCESSORIES',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 24, 2025',
    location: 'Rec Center Lockers',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2pQgqAU8FBvHs78Vmf5dmzkB1BAGM-MYGXLH2Hgt_DbzhwdKIzHbTr6f7BYypkR0gI56j_BNeU6LD74vor4EwrCWRhCGz3H9ZgQaJJ-2AciSYE1zJhQSGezfdvwEPfPfuJO8ps7hCtTp7aBVZRDF0hECAP1gV9m1ix5yg76FBcegCvp84ANyJmitk0vtyakOAnvCmaGJHGFZzq1CIANoTkyl-0NPjmOeoPEGzMXV0uZnXX9osJDFnNw',
    imageAlt: 'Keys attached to red campus strap and fob.',
  },
  {
    id: 'calculus-textbook-9th',
    title: 'Calculus: Early Transcendentals 9th Ed',
    category: 'BOOKS & STUDY MATERIAL',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 23, 2025',
    location: 'Math & Science Bldg',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAd-Q3IfZLJhrRk6SOdTvaKWt6ivPBXqkdK-2Ta6b2L0nuRL4JklkwR8Lu391niFdb2tAv4M7qemA5EiICfGNJ0bDgxqhpoYZ8QcLQNLsoiD862lol907_uXvKMQwz5o4FptAd01exC7K2j8wJj2ocJVYgvGDtQftNHARCy3MzR4fNQtnQbbeXNYet6UpxdBv_4i9bZ6jOwEPBL3rEo9cMZzawOwoUsJZCzqAxRHmDfAXaqN4gLux79_g',
    imageAlt: 'Calculus Early Transcendentals hardcover textbook on a desk.',
  },
];

const DEFAULT_RECENTLY_RESOLVED = [
  {
    id: 'sony-wh1000xm5',
    title: 'Sony WH-1000XM5 Headphones',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Resolved',
    date: 'Oct 23, 2025',
    location: 'Library 3rd Floor',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCAULVMR8fNlyLIUxx6WBrHNN37i0AAoEgfKDzyZ4HzdND1KTUJQLMYemtvoTxX_D_AwQirC6i782wPmpEbP23267Tmy2QNS6eBkt6iu8algEnZ7DFuod_5fMMdWkBDMpkKiImiaKgmW0pJmr7WyHb9Rq_1aW0Q9bYrON4oqYm5j-U8Oq7XBGSEDV-GhjLBdIKE9NSmdaq2wUU5JuHWdKzYcZNP5qccx39s42-2tuw9i8nRHOchGui4bA',
    imageAlt: 'Black Sony wireless headphones resting comfortably.',
  },
  {
    id: 'black-leather-wallet',
    title: 'Black Leather Bifold Wallet',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Resolved',
    date: 'Oct 22, 2025',
    location: 'Library Front Desk',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCERDryOxxsewZHFZ_peWEfmLuoB7SbV9hy38LnUH474HsCCoEuZ9ZDjve1FiMPevRhRTK7ahcTnnv4IsidvjPNcYBUZZZo5dM8E7mdJow1mWJELVDrnJqf1ZT4Dv_xxlFWGYZlN18DOyhSS0JHxgONQcm4R2auBx8PCf5GiSthmZbISrgkx3SRnbv4S6mMRexNIX4pAINlXOODJRmeIiOOJB1TXfjZ8NCRe2Escodacliycd7CDSlLNQ',
    imageAlt: 'Black grain leather bifold wallet on a table surface.',
  },
  {
    id: 'north-face-jacket',
    title: 'North Face Resolve Rain Jacket',
    category: 'APPAREL & BAGS',
    type: 'LOST',
    status: 'Resolved',
    date: 'Oct 21, 2025',
    location: 'Student Union Info Desk',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBRW-pbjHLqbjbsOXuj2JlZ34t2e5cnXaNiUSjMOV7BWQQ2i7zX3WNyd_LpVsstX0_UDd0nRzbSX1nXEPqSW4LeiV0TDpCKDaLdSUhdPdP6bmCG2MoVCuEulSSVPhjllFvMiK6s97F9lGz4nkZHvd8GdLuttc_e8IW1bataFbBGA-8VchgG9jnmRZiXsjzo9tMnjF3WKEbR1odgkWhhIIWpKb7CdsTvu2rTGWHNFtgfQJtcH3xNv_EvwA',
    imageAlt: 'Waterproof hooded rain jacket folded with brand logo.',
  },
  {
    id: 'hp-laptop-charger',
    title: 'HP 65W USB-C Laptop Charger',
    category: 'ELECTRONICS',
    type: 'FOUND',
    status: 'Resolved',
    date: 'Oct 20, 2025',
    location: 'Engineering Hall 204',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCeousHM6qo8qNrC8f44Uo50n7WOJKJsBqKrMGzOJ_n4abz4dUg5knGGDNKCgM7FiT38jekNjbYF62J1XfOmRCw1FkJbHnFu7-J5P6pIJndaXR_GoFpAODhfWAVVUCwqBN0oReOS9hrQ7g3Zsq2Hv4qRbIzJCIu7EkliaKGSy_loIq1acZppOEr8F3qXQrxnshh32Zk2aKrtUoOlkISpm3WfqzoxX0sx7gJ-QMJmohAiwGs6Fcs4Yj9Fg',
    imageAlt: 'Black laptop power adapter charger with cable.',
  },
];

export const Home = ({
  recentlyReported: propRecentlyReported,
  recentlyResolved: propRecentlyResolved,
  onBrowseAllClick,
  onItemClick,
  className = '',
}) => {
  const [reportedList, setReportedList] = useState(propRecentlyReported || DEFAULT_RECENTLY_REPORTED);
  const [resolvedList, setResolvedList] = useState(propRecentlyResolved || DEFAULT_RECENTLY_RESOLVED);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (propRecentlyReported) {
      setReportedList(propRecentlyReported);
      return;
    }

    let isMounted = true;
    fetchRecentlyReported(4)
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setReportedList(items);
        }
      })
      .catch((err) => {
        console.warn('Home fetchRecentlyReported error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [propRecentlyReported]);

  useEffect(() => {
    if (propRecentlyResolved) {
      setResolvedList(propRecentlyResolved);
      return;
    }

    let isMounted = true;
    fetchRecentlyResolved(4)
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setResolvedList(items);
        }
      })
      .catch((err) => {
        console.warn('Home fetchRecentlyResolved error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [propRecentlyResolved]);

  const handleCardClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      setSelectedItem(item);
    }
  };

  return (
    <div className={`flex flex-col gap-10 w-full ${className}`}>
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-10 md:p-12 lg:py-16 shadow-[0_4px_24px_rgba(81,112,255,0.06)] flex flex-col justify-center">
        {/* Subtle geometric accents */}
        <div
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#5170ff]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute right-12 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-slate-100/80 blur-2xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.035] pointer-events-none hidden md:block"
          style={{
            backgroundImage: 'radial-gradient(#3b3b3b 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl flex flex-col gap-2">
          <h1 className="font-headline text-[32px] sm:text-[42px] leading-tight text-slate-900 font-bold tracking-tight">
            Lost something? Found something?{' '}
            <span className="text-[#2563eb]">
              Let&apos;s get it back where it belongs.
            </span>
          </h1>
          <p className="text-[17px] sm:text-[18px] text-slate-600 font-normal max-w-2xl leading-relaxed mt-1">
            ClaimIt is your campus lost and found — report an item, browse what&apos;s turned up, and claim what&apos;s
            yours.
          </p>
        </div>
      </section>

      {/* Section 1: Recently Reported */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb] block">
            SPOTTED ON CAMPUS
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="font-headline text-[28px] sm:text-[32px] leading-[36px] sm:leading-[40px] text-slate-900 font-bold tracking-tight">
              Recently Reported
            </h2>
            <a
              href="#browse-items"
              data-path="browse-items"
              onClick={(e) => {
                if (onBrowseAllClick) {
                  e.preventDefault();
                  onBrowseAllClick();
                }
              }}
              className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#2563eb] hover:underline transition-colors duration-200"
            >
              <span>See all in Browse Items</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </a>
          </div>
          <p className="text-[15px] sm:text-[16px] text-slate-600 mt-1">
            Latest lost and found items submitted by students and staff across campus.
          </p>
        </div>

        {/* 4 Item Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportedList.map((item) => (
            <ItemCard key={item.id} item={item} onClick={handleCardClick} />
          ))}
        </div>
      </section>

      {/* Section 2: Recently Resolved */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb] block">
            RETURNED TO OWNERS
          </span>
          <h2 className="font-headline text-[28px] sm:text-[32px] leading-[36px] sm:leading-[40px] text-slate-900 font-bold tracking-tight">
            Recently Resolved
          </h2>
          <p className="text-[15px] sm:text-[16px] text-slate-600 mt-1">
            Items successfully verified and reunited with their campus owners.
          </p>
        </div>

        {/* 4 Item Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {resolvedList.map((item) => (
            <ItemCard key={item.id} item={item} onClick={handleCardClick} />
          ))}
        </div>
      </section>

      {/* Item Details Modal when clicked directly from Home page */}
      {selectedItem && (
        <BrowseItemDetailsModal
          isOpen={Boolean(selectedItem)}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onOpenAction={() => {
            setSelectedItem(null);
            if (onBrowseAllClick) {
              onBrowseAllClick();
            }
          }}
        />
      )}
    </div>
  );
};

export default Home;
