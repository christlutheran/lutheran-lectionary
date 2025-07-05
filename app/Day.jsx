import * as React from "react";
import { DateTime } from "luxon";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";

import { Week } from "../lib/Week";
import { KeyLoader } from "../lib/KeyLoader";
import { findProperByType, findColor } from "../lib/utils";

import lectionary from "../data/lsb-1yr.json";
import festivals from "../data/lsb-festivals.json";
import daily from "../data/lsb-daily.json";
import commemorations from "../data/lsb-commemorations.json";

import types from "../data/types.json";

const typesById = {};
types.forEach((type) => {
  typesById[type.type] = type;
});

const loader = new KeyLoader({
  lectionary,
  festivals,
  daily,
  commemorations,
});

/**
 * @typedef {object} Props
 * @prop {number} year
 * @prop {number} month
 * @prop {number} day
 * @extends {Component<Props>}
 */
export default class Day extends React.Component {
  getDate() {
    const { year, month, day } = this.props;
    return DateTime.fromObject({ year, month, day });
  }

  getTitle(day) {
    const festivalTitle = findProperByType(day.propers.festival, 0)?.text;
    const sundayTitle = findProperByType(day.sunday.lectionary, 0)?.text;
    const weekdayTitle =
      day.date.weekday === 7
        ? null
        : `${day.date.weekdayLong} of ${sundayTitle}`;
    return festivalTitle || weekdayTitle || sundayTitle;
  }

  getSectionId(i, type) {
    return `proper_${i}_${typesById[type].name
      .toLowerCase()
      .replace(" ", "_")}`;
  }

  getAccordanceUrl(text) {
    const end = text.indexOf("-") === -1 ? text.length : text.indexOf("-");
    const passage = text.replace(" ", "_").substring(0, end);
    return `accord://read/?#${passage}`;
  }

  scrollToSection(i, type) {
    return () => {
      window.scrollTo({
        top: document.getElementById(this.getSectionId(i, type)).offsetTop - 60,
        behavior: "smooth",
      });
    };
  }

  handleScrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  getLiturgicalColorClass(color) {
    if (!color) return "liturgical-white";
    const colorLower = color.toLowerCase();
    return `liturgical-${colorLower}`;
  }

  // Get the liturgical color for a specific date (same logic as calendar view)
  getLiturgicalColorForDate(date) {
    const weekCalculator = new Week(date);
    const week = weekCalculator.getWeek();
    const sunday = weekCalculator.getSunday();

    const dayData = {
      date,
      week,
      propers: loader.load(date, week),
      sunday: loader.load(sunday, week),
    };

    return findColor(
      // Don't let festivals trump Sundays
      date.weekday === 7 ? null : dayData.propers.festivals,
      dayData.propers.lectionary,
      dayData.sunday.lectionary
    )?.toLowerCase() ?? "none";
  }

  getReadingIcon(type) {
    switch (type) {
      case 19: return "fas fa-scroll"; // Old Testament
      case 1: return "fas fa-envelope"; // Epistle
      case 2: return "fas fa-cross"; // Gospel
      case 20: return "fas fa-praying-hands"; // Collect
      case 38: return "fas fa-book-open"; // First Reading
      case 39: return "fas fa-book"; // Second Reading
      default: return "fas fa-bookmark";
    }
  }

  render() {
    const date = this.getDate();
    const yesterday = this.getDate().minus({ days: 1 });
    const tomorrow = this.getDate().plus({ days: 1 });
    const weekCalculator = new Week(date);
    const week = weekCalculator.getWeek();
    const sunday = weekCalculator.getSunday();

    const day = {
      date,
      week,
      propers: loader.load(date, week),
      sunday: loader.load(sunday, week),
    };

    day.propers.daily = [
      // Find our commemoration and prepend it to the daily lectionary propers
      {
        ...(findProperByType(day.propers.commemorations, 37) ?? {
          text: "Daily Lectionary",
        }),
        type: 0, // Reset commemoration description to title
      },
      // Only include the first two daily readings (week takes precedent over month)
      ...day.propers.daily.slice(0, 2),
    ];

    // If this is a week day and we have no other propers, append Sunday's collect
    if (
      day.propers.lectionary.length === 0 &&
      day.propers.festivals.length === 0
    ) {
      const sundayCollect = findProperByType(day.sunday.lectionary, 20);

      // TODO: Adjust the title
      if (sundayCollect) {
        day.propers.daily.splice(1, 0, sundayCollect);
      }
    }

    const title = this.getTitle(day);
    const color = findColor(
      day.propers.festival,
      day.propers.lectionary,
      day.sunday.lectionary
    )?.toLowerCase();
    const colorClass = this.getLiturgicalColorClass(color);

    // Get liturgical colors for navigation dates
    const yesterdayColor = this.getLiturgicalColorForDate(yesterday);
    const tomorrowColor = this.getLiturgicalColorForDate(tomorrow);
    const yesterdayColorClass = this.getLiturgicalColorClass(yesterdayColor);
    const tomorrowColorClass = this.getLiturgicalColorClass(tomorrowColor);

    // Build meta info for this day
    const formattedDate = date.toFormat("yyyy-LL-dd");
    const url = `https://lectionary.christlutheranmanhattan.org/${date.toFormat("yyyy/LL/dd")}/`;
    const description = `Readings and propers for ${title} (${date.toLocaleString({ month: "long", day: "2-digit", year: "numeric" })}) in the Historic Lutheran Lectionary.`;
    const image = "https://lectionary.christlutheranmanhattan.org/android-chrome-512x512.png";

    return (
      <>
        <Helmet>
          <title>{`${title} · Lutheran Lectionary - Christ Lutheran, Manhattan, KS`}</title>
          <meta name="description" content={description} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={url} />
          <meta property="og:title" content={`${title} · Lutheran Lectionary - Christ Lutheran Church, Manhattan, KS`} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={image} />
          <meta property="og:site_name" content="Christ Lutheran Church Manhattan, KS" />
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content={url} />
          <meta property="twitter:title" content={`${title} · Lutheran Lectionary - Christ Lutheran Church, Manhattan, KS`} />
          <meta property="twitter:description" content={description} />
          <meta property="twitter:image" content={image} />
          <link rel="canonical" href={url} />
        </Helmet>
        <div className="day-view mx-auto max-w-4xl my-8">
          {/* Navigation with liturgical colors */}
          <nav className="day-nav p-4 flex items-center justify-between">
            <Link 
              to={`/${yesterday.toFormat("y/LL/dd")}/`}
              className={`flex items-center gap-2 ${yesterdayColorClass} hover:opacity-80 transition-opacity`}
            >
              <i className="fas fa-chevron-left"></i>
              <span className="font-garamond">
                {yesterday.toFormat("LLLL d, y")}
              </span>
            </Link>
            
            <Link 
              className="text-center font-cinzel font-semibold text-white hover:opacity-80 transition-opacity" 
              to={`/${date.toFormat("y/LL")}/`}
            >
              <i className="fas fa-calendar-alt mr-2"></i>
              {date.toFormat("LLLL")}
            </Link>
            
            <Link 
              to={`/${tomorrow.toFormat("y/LL/dd")}/`}
              className={`flex items-center gap-2 ${tomorrowColorClass} hover:opacity-80 transition-opacity`}
            >
              <span className="font-garamond">
                {tomorrow.toFormat("LLLL d, y")}
              </span>
              <i className="fas fa-chevron-right"></i>
            </Link>
          </nav>

          <div className="p-6">
            {/* Date and Title with liturgical color */}
            <div className="text-center mb-8">
              <h2 className={`font-cinzel text-3xl md:text-4xl font-bold mb-2 ${colorClass}`}>
                <i className="fas fa-calendar-day mr-3"></i>
                {date.toLocaleString({
                  month: "long",
                  day: "2-digit",
                  year: "numeric",
                })}
              </h2>
              <h3 className={`font-garamond text-xl md:text-2xl ${colorClass}`}>
                {title}
              </h3>
            </div>

            {/* Table of Contents */}
            <div className="mb-8">
              
              {[day.propers.lectionary, day.propers.festivals, day.propers.daily]
                .filter((p) => p.length > 0)
                .map((propers, i) => (
                  <div key={`propers-toc-${i}`} className="mb-4">
                    <h5 className={`font-garamond text-base font-semibold mb-2 ${this.getLiturgicalColorClass(findColor(propers)?.toLowerCase())}`}>
                      <i className="fas fa-cross mr-2"></i>
                      {findProperByType(propers, 0)?.text}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                      {propers
                        .filter(
                          (proper) => typesById[proper.type]?.is_viewable ?? true
                        )
                        .map((proper, j) => (
                          <button
                            key={`propers-toc-${i}-${j}`}
                            className="text-left p-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors reading-link font-garamond"
                            onClick={this.scrollToSection(i, proper.type)}
                          >
                            <i className={`${this.getReadingIcon(proper.type)} mr-2 text-sm`}></i>
                            {typesById[proper.type].name}
                            {typesById[proper.type].is_reading && (
                              <span className="text-gray-600">: {proper.text}</span>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
            </div>

            {/* Propers Sections */}
            {[day.propers.lectionary, day.propers.festivals, day.propers.daily]
              .filter((p) => p.length > 0)
              .map((propers, i) => (
                <div key={`propers-${i}`} className="proper-section">
                  <h2 className={`font-cinzel bg-solid-${this.getLiturgicalColorClass(findColor(propers)?.toLowerCase())}`}>
                    <i className="fas fa-cross mr-3"></i>
                    {findProperByType(propers, 0)?.text}
                  </h2>
                  
                  <div className="p-6">
                    {propers
                      .filter((proper) => typesById[proper.type]?.is_viewable ?? true)
                      .map((proper, j) => (
                        <div
                          id={this.getSectionId(i, proper.type)}
                          key={`propers-${i}-${j}`}
                          className="mb-8 last:mb-0"
                        >
                          <h3 className="font-garamond">
                            <i className={`${this.getReadingIcon(proper.type)} mr-2`}></i>
                            {typesById[proper.type].name}

                            {typesById[proper.type].is_reading && (
                              <span className="ml-2">
                                <span className="text-gray-500">·</span>
                                <a
                                  target="_blank"
                                  rel="noreferrer"
                                  href={`https://www.biblegateway.com/passage/?search=${proper.text}&version=ESV`}
                                  className="reading-link ml-2"
                                >
                                  {proper.text}
                                  <i className="fas fa-external-link-alt ml-1 text-xs"></i>
                                </a>
                                <a
                                  title="Open this reading using Accordance, if you don't have it check it out at http://accordancebible.com"
                                  href={this.getAccordanceUrl(proper.text)}
                                  className="ml-2"
                                >
                                  <i className="accordance-icon"></i>
                                </a>
                              </span>
                            )}
                          </h3>
                          
                          {!typesById[proper.type].is_reading && (
                            <div
                              className="mt-4 font-garamond text-gray-700 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: proper.text,
                              }}
                            />
                          )}
                          
                          <div className="text-right mt-4">
                            <button 
                              className="reading-link text-sm font-garamond"
                              onClick={this.handleScrollToTop}
                            >
                              <i className="fas fa-arrow-up mr-1"></i>
                              Back to top
                            </button>
                          </div>
                          
                          {j < propers.filter((p) => typesById[p.type]?.is_viewable ?? true).length - 1 && (
                            <hr className="mt-6 border-gray-300" />
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </>
    );
  }
}