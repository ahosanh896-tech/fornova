import React, { useRef, useState, useEffect, useCallback } from "react";
import { categories } from "../assets/assets";
import Title from "./Title";
import { useNavigate } from "react-router-dom";

const Categories = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const total = categories.length;
  const extended = [...categories, ...categories, ...categories];

  const [activeIndex, setActiveIndex] = useState(total);

  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const handleCategoryClick = (name) => {
    navigate("/collection", {
      state: { category: name.toLowerCase() },
    });
  };

  const scrollToIndex = useCallback((index, behavior = "smooth") => {
    const container = scrollRef.current;
    const child = container?.children[index];
    if (!child) return;

    const left =
      child.offsetLeft - container.offsetWidth / 2 + child.offsetWidth / 2;

    container.scrollTo({ left, behavior });
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      scrollToIndex(total, "auto");
    }, 100);
    return () => clearTimeout(id);
  }, [scrollToIndex, total]);

  // STABLE & JUMP-FREE infinite loop
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollTimeout;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const visibleWidth = container.offsetWidth;
          const scrollLeft = container.scrollLeft;
          const center = scrollLeft + visibleWidth / 2;

          let closestIndex = 0;
          let closestDistance = Infinity;
          const children = container.children;

          for (let i = 0; i < children.length; i++) {
            const childCenter =
              children[i].offsetLeft + children[i].offsetWidth / 2;
            const distance = Math.abs(center - childCenter);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = i;
            }
          }

          setActiveIndex((prev) =>
            prev !== closestIndex ? closestIndex : prev,
          );

          // Debounce the infinite loop reset
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            if (!children || children.length < total * 3) return;

            // FIX 1: Exact pixel width of 1 set of categories (Ignores padding issues)
            const exactSectionWidth =
              children[total].offsetLeft - children[0].offsetLeft;
            const currentScroll = container.scrollLeft;

            // Teleport exactly by the section width when hitting boundaries
            if (closestIndex < total) {
              container.scrollTo({
                left: currentScroll + exactSectionWidth,
                behavior: "auto",
              });
            } else if (closestIndex >= total * 2) {
              container.scrollTo({
                left: currentScroll - exactSectionWidth,
                behavior: "auto",
              });
            }
          }, 150); // Fires only after scrolling completely stops

          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [total]);

  // Auto-scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let interval;

    const startAutoScroll = () => {
      clearInterval(interval);
      interval = setInterval(
        () => {
          scrollToIndex(activeIndexRef.current + 1);
        },
        2800 + Math.random() * 800,
      );
    };

    startAutoScroll();

    const stopAutoScroll = () => clearInterval(interval);

    container.addEventListener("touchstart", stopAutoScroll, { passive: true });
    container.addEventListener("mousedown", stopAutoScroll);
    container.addEventListener("touchend", startAutoScroll, { passive: true });
    container.addEventListener("mouseup", startAutoScroll);
    container.addEventListener("mouseleave", startAutoScroll);

    return () => {
      clearInterval(interval);
      container.removeEventListener("touchstart", stopAutoScroll);
      container.removeEventListener("mousedown", stopAutoScroll);
      container.removeEventListener("touchend", startAutoScroll);
      container.removeEventListener("mouseup", startAutoScroll);
      container.removeEventListener("mouseleave", startAutoScroll);
    };
  }, [scrollToIndex]);

  // FIX 2: Compute real active index so clones share the exact same CSS states
  // This prevents the scaling animation from "flashing/jumping" during the teleport.
  const activeRealIndex = activeIndex % total;

  return (
    <div className="px-4 sm:px-8 lg:px-16 py-10">
      <div className="text-center mb-8 text-3xl">
        <Title text1={"Browse"} text2={"The Range"} />
        <p className="text-gray-500 text-sm sm:text-base mt-2">
          Discover furniture by category
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory sm:hidden px-6 no-scrollbar"
      >
        {extended.map((item, index) => {
          const realIndex = index % total;

          return (
            <div
              key={index}
              onClick={() => handleCategoryClick(categories[realIndex].name)}
              className={`snap-center snap-always shrink-0 w-[75%] cursor-pointer 
              transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] 
              will-change-transform ${
                // matching the real index so all 3 clones scale up simultaneously
                realIndex === activeRealIndex
                  ? "scale-100 opacity-100 z-10"
                  : "scale-[0.85] opacity-30"
              }`}
            >
              <div className="rounded-2xl overflow-hidden aspect-3/4 bg-gray-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover 
                  transition-transform duration-1000 
                  ease-[cubic-bezier(0.22,1,0.36,1)]"
                />
              </div>
              <p className="text-center mt-3 text-lg font-medium">
                {item.name}
              </p>
            </div>
          );
        })}
      </div>

      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-6">
        {categories.map((item, index) => (
          <div
            key={index}
            onClick={() => handleCategoryClick(item.name)}
            className="group cursor-pointer"
          >
            <div className="overflow-hidden shadow-lg rounded-xl">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-72 md:h-80 object-cover 
                transition-transform duration-500 ease-out 
                group-hover:scale-110"
              />
            </div>
            <p className="text-center mt-3 text-lg font-medium">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
