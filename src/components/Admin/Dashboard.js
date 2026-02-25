import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Dashboard.module.css';
import DeleteModal from './DeleteModal';
import Sidebar from './Sidebar';
import ProjectsManagement from './ProjectsManagement';
import AboutManagement from './AboutManagement';
import HeroManagement from './HeroManagement';
import SocialManagement from './SocialManagement';
import ProfileManagement from './ProfileManagement';
import CareerManagement from './CareerManagement';
import ReviewsManagement from './ReviewsManagement';
import AvatarManagement from './AvatarManagement';
import EmailSettings from './EmailSettings';
import SubscribersManagement from './SubscribersManagement';

const SUBSCRIBER_SEEN_KEY = 'admin:lastSeen:subscribers';
const REVIEW_SEEN_KEY = 'admin:lastSeen:reviews';

const getStoredTimestamp = (key) => {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(key);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const setStoredTimestamp = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, String(value));
};

const getItemTimestamp = (item) => {
  const value = item?.createdAt || item?.updatedAt || '';
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
};

const countNewItems = (items, lastSeen) => {
  if (!Array.isArray(items) || !items.length) return 0;
  let count = 0;
  items.forEach((item) => {
    const ts = getItemTimestamp(item);
    if (ts && ts > lastSeen) count += 1;
  });
  return count;
};

const StatisticsSection = ({ stats, visits, visitsLoading }) => {
  const [projects, setProjects] = useState([]);
  const [sparklineHover, setSparklineHover] = useState(null);
  const [donutHover, setDonutHover] = useState(null);
  const [donutPinned, setDonutPinned] = useState(false);
  const donutRef = useRef(null);
  const donutWrapRef = useRef(null);
  const safeStats = Array.isArray(stats) ? stats : [];
  const safeVisits = Array.isArray(visits) ? visits : [];
  const statsSorted = [...safeStats].sort((a, b) => new Date(a.date) - new Date(b.date));
  const last7Stats = statsSorted.slice(-7);
  const prev7Stats = statsSorted.slice(-14, -7);
  const sumByKey = (items, key) =>
    items.reduce((total, item) => total + (Number(item?.[key]) || 0), 0);
  const sumProjectClicks = (items) =>
    items.reduce((total, item) => {
      const details = Array.isArray(item?.project_details) ? item.project_details : [];
      return total + details.reduce((sum, project) => sum + (project.clicks || 0), 0);
    }, 0);
  const last7Visits = sumByKey(last7Stats, 'visits');
  const prev7Visits = sumByKey(prev7Stats, 'visits');
  const last7Clicks = sumProjectClicks(last7Stats);
  const prev7Clicks = sumProjectClicks(prev7Stats);
  const visitsDelta = prev7Visits ? ((last7Visits - prev7Visits) / prev7Visits) * 100 : null;
  const clicksDelta = prev7Clicks ? ((last7Clicks - prev7Clicks) / prev7Clicks) * 100 : null;
  const bestDay = last7Stats.reduce((best, item) => {
    if (!best || (item?.visits || 0) > (best?.visits || 0)) return item;
    return best;
  }, null);
  const visitsSeries = last7Stats.map((item) => Number(item?.visits) || 0);
  const clicksSeries = last7Stats.map((item) => {
    const details = Array.isArray(item?.project_details) ? item.project_details : [];
    return details.reduce((sum, project) => sum + (project.clicks || 0), 0);
  });
  const buildSparklinePoints = (values, width = 220, height = 70, padding = 6) => {
    if (!values.length) return [];
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    return values.map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y =
        padding +
        (height - padding * 2) -
        ((value - min) / range) * (height - padding * 2);
      return { x, y };
    });
  };
  const visitsPointsArr = buildSparklinePoints(visitsSeries);
  const clicksPointsArr = buildSparklinePoints(clicksSeries);
  const visitsPoints = visitsPointsArr.map((point) => `${point.x},${point.y}`).join(' ');
  const clicksPoints = clicksPointsArr.map((point) => `${point.x},${point.y}`).join(' ');
  const trendRows = last7Stats
    .map((item, index) => {
      const prev = last7Stats[index - 1];
      const delta = prev ? (item.visits || 0) - (prev.visits || 0) : 0;
      return {
        date: item?.date,
        visits: item?.visits || 0,
        delta
      };
    })
    .slice(-5)
    .reverse();

  const sparklineCount = Math.max(visitsPointsArr.length, clicksPointsArr.length, last7Stats.length);
  const getPointerX = (event) => {
    if (event?.touches?.length) return event.touches[0].clientX;
    if (event?.changedTouches?.length) return event.changedTouches[0].clientX;
    return event.clientX;
  };
  const getPointerY = (event) => {
    if (event?.touches?.length) return event.touches[0].clientY;
    if (event?.changedTouches?.length) return event.changedTouches[0].clientY;
    return event.clientY;
  };
  const handleSparklineMove = (event) => {
    if (!sparklineCount) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width) return;
    const clientX = getPointerX(event);
    if (typeof clientX !== 'number') return;
    const ratioRaw = (clientX - bounds.left) / bounds.width;
    const ratio = Math.min(Math.max(ratioRaw, 0), 1);
    const index = Math.round(ratio * Math.max(sparklineCount - 1, 0));
    setSparklineHover({ index, leftPct: ratio * 100 });
  };

  const handleSparklineLeave = () => {
    setSparklineHover(null);
  };

  const hoverIndex = sparklineHover?.index ?? null;
  const hoverData = hoverIndex !== null ? last7Stats[hoverIndex] : null;
  const hoverVisits = hoverIndex !== null ? visitsSeries[hoverIndex] ?? 0 : 0;
  const hoverClicks = hoverIndex !== null ? clicksSeries[hoverIndex] ?? 0 : 0;
  const hoverVisitsPoint = hoverIndex !== null ? visitsPointsArr[hoverIndex] : null;
  const hoverClicksPoint = hoverIndex !== null ? clicksPointsArr[hoverIndex] : null;
  const hoverX = hoverVisitsPoint?.x ?? hoverClicksPoint?.x ?? 0;

  const isTouchLike = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const showDonutTooltip = (event, item, index, { pin = false } = {}) => {
    const donutRect = donutRef.current?.getBoundingClientRect();
    const wrapRect = donutWrapRef.current?.getBoundingClientRect() || donutRect;
    if (!donutRect || !wrapRect) return;
    const clientX = getPointerX(event);
    const clientY = getPointerY(event);
    if (typeof clientX !== 'number' || typeof clientY !== 'number') return;
    const centerX = donutRect.left + donutRect.width / 2;
    const centerY = donutRect.top + donutRect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const verticalBias = 12;
    let direction = 'top';
    if (dy < -verticalBias) {
      direction = 'top';
    } else if (dy > verticalBias) {
      direction = 'bottom';
    } else {
      direction = dx >= 0 ? 'right' : 'left';
    }
    const touchMode = isTouchLike() || pin;
    if (touchMode) {
      const localX = clientX - wrapRect.left;
      const localY = clientY - wrapRect.top;
      const tooltipWidth = window.innerWidth <= 768 ? 160 : 200;
      const tooltipHeight = 90;
      const pad = 8;
      let leftPx = localX;
      let topPx = localY;

      if (direction === 'top') {
        leftPx -= tooltipWidth / 2;
        topPx -= tooltipHeight + 12;
      } else if (direction === 'bottom') {
        leftPx -= tooltipWidth / 2;
        topPx += 12;
      } else if (direction === 'left') {
        leftPx -= tooltipWidth + 12;
        topPx -= tooltipHeight / 2;
      } else if (direction === 'right') {
        leftPx += 12;
        topPx -= tooltipHeight / 2;
      }

      leftPx = Math.min(Math.max(leftPx, pad), wrapRect.width - tooltipWidth - pad);
      topPx = Math.min(Math.max(topPx, pad), wrapRect.height - tooltipHeight - pad);

      setDonutHover({
        index,
        left: leftPx,
        top: topPx,
        item,
        direction,
        mode: 'pixel'
      });
    } else {
      const leftPct = ((clientX - donutRect.left) / donutRect.width) * 100;
      const topPct = ((clientY - donutRect.top) / donutRect.height) * 100;
      setDonutHover({
        index,
        left: leftPct,
        top: topPct,
        item,
        direction,
        mode: 'percent'
      });
    }
    if (pin) {
      setDonutPinned(true);
    }
  };

  const handleDonutLeave = () => {
    if (donutPinned) return;
    setDonutHover(null);
  };

  const isSegmentTarget = (event) => event?.target?.dataset?.segment === 'true';

  const handleDonutChartMove = (event) => {
    if (donutPinned) return;
    if (!isSegmentTarget(event)) {
      setDonutHover(null);
    }
  };

  const handleDonutChartPress = (event) => {
    if (isSegmentTarget(event)) return;
    if (donutPinned) {
      setDonutPinned(false);
      setDonutHover(null);
    }
  };

  const handleDonutHover = (event, item, index) => {
    if (donutPinned || isTouchLike()) return;
    showDonutTooltip(event, item, index);
  };

  const handleDonutClick = (event, item, index) => {
    if (!isTouchLike()) return;
    showDonutTooltip(event, item, index, { pin: true });
  };

  useEffect(() => {
    if (!donutPinned) return undefined;
    const handlePointerDown = (event) => {
      if (donutWrapRef.current && donutWrapRef.current.contains(event.target)) return;
      setDonutPinned(false);
      setDonutHover(null);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [donutPinned]);

  const projectClicks = projects.map((project) => {
    const total = safeStats.reduce((sum, stat) => {
      const details = Array.isArray(stat?.project_details) ? stat.project_details : [];
      const match = details.find((entry) => entry.project_id?.toString?.() === project._id?.toString?.());
      return sum + (match?.clicks || 0);
    }, 0);
    return { id: project._id, title: project.title || 'Untitled', value: total };
  }).filter((item) => item.value > 0);

  const topProjectClicks = projectClicks.sort((a, b) => b.value - a.value).slice(0, 4);
  const totalProjectClicks = topProjectClicks.reduce((sum, item) => sum + item.value, 0);
  const donutColors = ['#64ffda', '#6aa6ff', '#ffb454', '#ff6b6b'];
  const formatCountry = (countryCode) => {
    if (!countryCode || countryCode === 'Unknown') return 'Unknown';
    if (countryCode.length === 2 && typeof Intl !== 'undefined' && Intl.DisplayNames) {
      try {
        const display = new Intl.DisplayNames(['en'], { type: 'region' });
        return display.of(countryCode) || countryCode;
      } catch (error) {
        return countryCode;
      }
    }
    return countryCode;
  };
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  return (
    <section className={styles.messagesSection}>
      <div className={styles.messagesList}>
        <div className={styles.statsCards}>
          <div className={styles.messageCard}>
            <h3>Total Visits</h3>
            <p className={styles.statsNumber}>
              {safeStats.reduce((total, stat) => total + (stat.visits || 0), 0)}
            </p>
            <div className={styles.trendMeta}>
              <span className={styles.trendLabel}>Last 7 days</span>
              <span
                className={`${styles.trendValue} ${
                  visitsDelta === null ? styles.trendNeutral : visitsDelta >= 0 ? styles.trendUp : styles.trendDown
                }`}
              >
                {visitsDelta === null ? '—' : `${visitsDelta >= 0 ? '+' : ''}${visitsDelta.toFixed(1)}%`}
              </span>
            </div>
          </div>
          <div className={styles.messageCard}>
            <h3>Total Project Clicks</h3>
            <p className={styles.statsNumber}>
              {safeStats.reduce((total, stat) => {
                const projectDetails = Array.isArray(stat.project_details) ? stat.project_details : [];
                const dailyClicks = projectDetails.reduce((sum, project) => sum + (project.clicks || 0), 0);
                return total + dailyClicks;
              }, 0)}
            </p>
            <div className={styles.trendMeta}>
              <span className={styles.trendLabel}>Last 7 days</span>
              <span
                className={`${styles.trendValue} ${
                  clicksDelta === null ? styles.trendNeutral : clicksDelta >= 0 ? styles.trendUp : styles.trendDown
                }`}
              >
                {clicksDelta === null ? '—' : `${clicksDelta >= 0 ? '+' : ''}${clicksDelta.toFixed(1)}%`}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.insightsGrid}>
          <div className={styles.messageCard}>
            <div className={styles.cardHeaderRow}>
              <h3>Weekly Trend</h3>
              <span className={styles.mutedText}>Visits vs Clicks</span>
            </div>
            <div className={styles.sparklineWrapper}>
              <div
                className={styles.sparklineInteractive}
                onMouseMove={handleSparklineMove}
                onMouseLeave={handleSparklineLeave}
                onTouchStart={handleSparklineMove}
                onTouchMove={handleSparklineMove}
                onTouchEnd={handleSparklineLeave}
              >
                <svg className={styles.sparkline} viewBox="0 0 220 70" preserveAspectRatio="none">
                  <polyline className={styles.sparklineLine} points={visitsPoints} />
                  <polyline className={styles.sparklineLineAlt} points={clicksPoints} />
                  {hoverIndex !== null && (
                    <>
                      <line className={styles.sparklineGuide} x1={hoverX} x2={hoverX} y1="6" y2="64" />
                      {hoverVisitsPoint && (
                        <circle
                          className={styles.sparklineDot}
                          cx={hoverVisitsPoint.x}
                          cy={hoverVisitsPoint.y}
                          r="4"
                        />
                      )}
                      {hoverClicksPoint && (
                        <circle
                          className={styles.sparklineDotAlt}
                          cx={hoverClicksPoint.x}
                          cy={hoverClicksPoint.y}
                          r="4"
                        />
                      )}
                    </>
                  )}
                </svg>
                {hoverData && (
                  <div className={styles.sparklineTooltip} style={{ left: `${sparklineHover.leftPct}%` }}>
                    <div className={styles.tooltipDate}>
                      {hoverData?.date ? new Date(hoverData.date).toLocaleDateString() : '—'}
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>Visits</span>
                      <strong>{hoverVisits}</strong>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span>Clicks</span>
                      <strong>{hoverClicks}</strong>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.sparklineLegend}>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.legendDotPrimary}`} />
                  Visits
                </span>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.legendDotAlt}`} />
                  Clicks
                </span>
              </div>
            </div>
            <div className={styles.trendList}>
              {trendRows.map((row, index) => (
                <div key={`${row.date}-${index}`} className={styles.trendRow}>
                  <div className={styles.trendInfo}>
                    <span
                      className={styles.trendDot}
                      style={{ backgroundColor: donutColors[index % donutColors.length] }}
                    />
                    <span>{row.date ? new Date(row.date).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className={styles.trendStats}>
                    <span className={styles.trendCount}>{row.visits}</span>
                    <span
                      className={`${styles.trendDelta} ${
                        row.delta > 0 ? styles.trendUp : row.delta < 0 ? styles.trendDown : styles.trendNeutral
                      }`}
                    >
                      {row.delta > 0 ? '▲' : row.delta < 0 ? '▼' : '•'} {Math.abs(row.delta)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.messageCard}>
            <div className={styles.cardHeaderRow}>
              <h3>Project Click Share</h3>
              <span className={styles.mutedText}>Top projects</span>
            </div>
            {totalProjectClicks === 0 ? (
              <div className={styles.emptyState}>No project clicks yet.</div>
            ) : (
              <div className={styles.donutLayout} ref={donutWrapRef}>
                <div
                  className={styles.donutChart}
                  ref={donutRef}
                  onMouseLeave={handleDonutLeave}
                  onMouseMove={handleDonutChartMove}
                  onClick={handleDonutChartPress}
                  onTouchStart={handleDonutChartPress}
                  onTouchEnd={handleDonutLeave}
                  onTouchMove={handleDonutChartMove}
                >
                  <svg className={styles.donut} viewBox="0 0 120 120">
                    <circle className={styles.donutTrack} cx="60" cy="60" r="44" />
                    {topProjectClicks.reduce((acc, item, idx) => {
                    const circumference = 2 * Math.PI * 44;
                    const portion = (item.value / totalProjectClicks) * circumference;
                    const offset = acc.offset;
                    acc.offset += portion;
                    acc.nodes.push(
                      <circle
                        key={item.id}
                        className={`${styles.donutSegment} ${
                          donutHover && donutHover.index === idx
                            ? styles.donutSegmentActive
                            : donutHover
                              ? styles.donutSegmentDim
                              : ''
                        }`}
                        cx="60"
                        cy="60"
                        r="44"
                        stroke={donutColors[idx % donutColors.length]}
                        strokeDasharray={`${portion} ${circumference - portion}`}
                        strokeDashoffset={-offset}
                        data-segment="true"
                        onMouseMove={(event) => handleDonutHover(event, item, idx)}
                        onMouseEnter={(event) => handleDonutHover(event, item, idx)}
                        onTouchStart={(event) => handleDonutClick(event, item, idx)}
                        onTouchMove={(event) => handleDonutClick(event, item, idx)}
                        onClick={(event) => handleDonutClick(event, item, idx)}
                      />
                    );
                    return acc;
                  }, { offset: 0, nodes: [] }).nodes}
                  </svg>
                  {donutHover && donutHover.item && (
                    <div
                      className={`${styles.donutTooltip} ${
                        donutHover.mode === 'percent'
                          ? donutHover.direction === 'right'
                            ? styles.donutTooltipRight
                            : donutHover.direction === 'left'
                              ? styles.donutTooltipLeft
                              : donutHover.direction === 'bottom'
                                ? styles.donutTooltipBottom
                                : styles.donutTooltipTop
                          : ''
                      }`}
                      style={{
                        left: donutHover.mode === 'percent'
                          ? `${donutHover.left}%`
                          : `${donutHover.left}px`,
                        top: donutHover.mode === 'percent'
                          ? `${donutHover.top}%`
                          : `${donutHover.top}px`
                      }}
                    >
                      <div
                        className={styles.tooltipDate}
                        style={{ color: donutColors[donutHover.index % donutColors.length] }}
                      >
                        {donutHover.item.title}
                      </div>
                      <div className={styles.tooltipRow}>
                        <span>Clicks</span>
                        <strong>{donutHover.item.value}</strong>
                      </div>
                      <div className={styles.tooltipRow}>
                        <span>Share</span>
                        <strong>
                          {totalProjectClicks
                            ? `${((donutHover.item.value / totalProjectClicks) * 100).toFixed(1)}%`
                            : '0%'}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.donutLegend}>
                  {topProjectClicks.map((item, idx) => {
                    const percent = totalProjectClicks ? (item.value / totalProjectClicks) * 100 : 0;
                    return (
                      <div
                        key={item.id}
                        className={styles.legendRow}
                        onMouseEnter={(event) => handleDonutHover(event, item, idx)}
                        onMouseMove={(event) => handleDonutHover(event, item, idx)}
                        onMouseLeave={handleDonutLeave}
                        onClick={(event) => handleDonutClick(event, item, idx)}
                        onTouchStart={(event) => handleDonutClick(event, item, idx)}
                      >
                        <span
                          className={styles.legendDot}
                          style={{ backgroundColor: donutColors[idx % donutColors.length] }}
                        />
                        <span className={styles.legendLabel}>{item.title}</span>
                        <span className={styles.legendValue}>{percent.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className={styles.highlightGrid}>
              <div className={styles.highlightItem}>
                <span className={styles.highlightLabel}>Last 7 days</span>
                <span className={styles.highlightValue}>{last7Visits} visits</span>
              </div>
              <div className={styles.highlightItem}>
                <span className={styles.highlightLabel}>Clicks</span>
                <span className={styles.highlightValue}>{last7Clicks}</span>
              </div>
              <div className={styles.highlightItem}>
                <span className={styles.highlightLabel}>Best day</span>
                <span className={styles.highlightValue}>
                  {bestDay ? `${bestDay.visits} visits` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.messageCard}>
          <h3>Recent Statistics</h3>
          <div className={styles.tableScroll}>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Visits</th>
                  <th>Project Clicks</th>
                </tr>
              </thead>
              <tbody>
                {safeStats.map((stat) => {
                  const projectDetails = Array.isArray(stat.project_details) ? stat.project_details : [];
                  const clicks = projectDetails.reduce((sum, project) => sum + (project.clicks || 0), 0);
                return (
                <tr key={stat.date}>
                  <td data-label="Date">{new Date(stat.date).toLocaleDateString()}</td>
                  <td data-label="Visits">{stat.visits}</td>
                  <td data-label="Project Clicks">{clicks}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
        <div className={styles.messageCard}>
          <h3>Recent Visits</h3>
          <div className={styles.tableScroll}>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Location</th>
                  <th>IP</th>
                  <th>Entry</th>
                  <th>Device</th>
                </tr>
              </thead>
              <tbody>
                {visitsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <tr key={`visit-skeleton-${index}`}>
                      <td data-label="Time"><div className={`${styles.tableSkeleton} skeleton`} /></td>
                      <td data-label="Location"><div className={`${styles.tableSkeleton} skeleton`} /></td>
                      <td data-label="IP"><div className={`${styles.tableSkeleton} ${styles.tableSkeletonShort} skeleton`} /></td>
                      <td data-label="Entry"><div className={`${styles.tableSkeleton} skeleton`} /></td>
                      <td data-label="Device"><div className={`${styles.tableSkeleton} ${styles.tableSkeletonShort} skeleton`} /></td>
                    </tr>
                  ))
                ) : safeVisits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyState}>No visit logs yet.</td>
                  </tr>
                ) : (
                  safeVisits.map((visit) => {
                    const location = [visit.city, visit.region, formatCountry(visit.country)]
                      .filter(Boolean)
                      .join(', ') || 'Unknown';
                    const entryPath = visit.path || '-';
                    const referrer = visit.referrer || 'Direct';
                    const device = visit.device || 'Unknown';
                    const platform = visit.platform ? ` · ${visit.platform}` : '';
                    return (
                      <tr key={visit._id || visit.id || visit.createdAt}>
                        <td className={styles.monoCell} data-label="Time">
                          {new Date(visit.createdAt || visit.updatedAt).toLocaleString()}
                        </td>
                        <td data-label="Location">
                          <div className={styles.locationText}>{location}</div>
                          {visit.timezone && <div className={styles.visitMeta}>{visit.timezone}</div>}
                        </td>
                        <td className={styles.monoCell} data-label="IP">{visit.ip || 'Unknown'}</td>
                        <td data-label="Entry">
                          <div className={styles.pathText}>{entryPath}</div>
                          <div className={styles.visitMeta}>Ref: {referrer}</div>
                        </td>
                        <td data-label="Device">
                          <div className={styles.deviceText}>{device}{platform}</div>
                          {visit.screen && <div className={styles.visitMeta}>{visit.screen}</div>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className={styles.messageCard}>
          <h3>Most Clicked Projects</h3>
          <div className={styles.projectGrid}>
            {projects.map(project => {
              const totalClicks = safeStats.reduce((total, stat) => {
                const projectDetails = Array.isArray(stat.project_details) ? stat.project_details : [];
                const projectStat = projectDetails.find(p => p.project_id?.toString?.() === project._id?.toString?.());
                return total + (projectStat?.clicks || 0);
              }, 0);
              
              return (
                <div key={project._id} className={styles.projectThumbnail}>
                  <img src={project.image} alt={project.title} />
                  <div className={styles.projectInfo}>
                    <h4>{project.title}</h4>
                    <p>Clicks: {totalClicks}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

const MessagesSection = ({ messages, error, onDeleteClick, onMarkRead, isLoading }) => {
  const skeletons = Array.from({ length: 3 });

  return (
    <section className={styles.messagesSection}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.messagesList}>
        {isLoading ? (
          skeletons.map((_, index) => (
            <div key={`message-skeleton-${index}`} className={styles.messageCard}>
              <div className={styles.messageHeader}>
                <div className={`${styles.skeletonHeader} skeleton`} />
                <div className={`${styles.skeletonChip} skeleton`} />
              </div>
              <div className={`${styles.skeletonLine} skeleton`} />
              <div className={`${styles.skeletonLine} skeleton`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort} skeleton`} />
              <div className={`${styles.skeletonMeta} skeleton`} />
            </div>
          ))
        ) : messages.length === 0 ? (
          <p>No messages found.</p>
        ) : (
          messages.map(message => (
            <div
              key={message._id}
              className={`${styles.messageCard} ${message.isRead ? styles.messageRead : styles.messageUnread}`}
            >
              <div className={styles.messageHeader}>
                <div className={styles.messageTitle}>
                  <h3>{message.name}</h3>
                  {message.isRead ? (
                    <span className={styles.readBadge}>Read</span>
                  ) : (
                    <span className={styles.unreadBadge}>New</span>
                  )}
                </div>
                <div className={styles.messageActions}>
                  {!message.isRead && (
                    <button
                      onClick={() => onMarkRead(message)}
                      className={styles.readButton}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteClick(message)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className={styles.messageEmail}>{message.email}</p>
              <p className={styles.messageContent}>{message.message}</p>
              <p className={styles.messageDate}>
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

const Dashboard = ({ isMagicTheme = false, onToggleTheme }) => {
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [visitLogs, setVisitLogs] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [subscriberNewCount, setSubscriberNewCount] = useState(0);
  const [reviewNewCount, setReviewNewCount] = useState(0);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location.pathname);

  const fetchStatistics = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      } else {
        console.error('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    setMessagesLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data.map((item) => ({ ...item, isRead: Boolean(item.isRead) }))
          : [];
        setMessages(normalized);
      } else {
        setError('Failed to fetch messages');
      }
    } catch (error) {
      setError('Error loading messages');
    }
    setMessagesLoading(false);
  }, []);

  const fetchVisitLogs = useCallback(async () => {
    setVisitsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/statistics/visits?limit=60`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVisitLogs(data);
      } else {
        console.error('Failed to fetch visit logs');
      }
    } catch (error) {
      console.error('Error loading visit logs:', error);
    }
    setVisitsLoading(false);
  }, []);

  const fetchSubscriberBadge = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/subscribers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const lastSeen = getStoredTimestamp(SUBSCRIBER_SEEN_KEY);
        setSubscriberNewCount(countNewItems(Array.isArray(data) ? data : [], lastSeen));
      }
    } catch (error) {
      // ignore badge fetch errors
    }
  }, []);

  const fetchReviewBadge = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const lastSeen = getStoredTimestamp(REVIEW_SEEN_KEY);
        setReviewNewCount(countNewItems(Array.isArray(data) ? data : [], lastSeen));
      }
    } catch (error) {
      // ignore badge fetch errors
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchStatistics();
    fetchVisitLogs();
    fetchSubscriberBadge();
    fetchReviewBadge();
    // Check initial sidebar state
    setIsSidebarCollapsed(document.body.classList.contains('sidebar-collapsed'));
  }, [fetchMessages, fetchStatistics, fetchVisitLogs, fetchSubscriberBadge, fetchReviewBadge]);

  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return undefined;

    const socket = io(process.env.REACT_APP_API_URL, {
      transports: ['websocket'],
      auth: { token }
    });

    const getMessageId = (message) => message?._id || message?.id;
    const getVisitId = (visit) => visit?._id || visit?.id || visit?.createdAt;

    socket.on('message:new', (message) => {
      setMessages((prev) => {
        const id = getMessageId(message);
        if (!id || prev.some((item) => getMessageId(item) === id)) return prev;
        return [{ ...message, isRead: Boolean(message?.isRead) }, ...prev];
      });
    });

    socket.on('message:delete', ({ id }) => {
      if (!id) return;
      setMessages((prev) => prev.filter((message) => getMessageId(message) !== id));
    });

    socket.on('message:read', ({ id, isRead }) => {
      if (!id) return;
      setMessages((prev) =>
        prev.map((message) =>
          getMessageId(message) === id ? { ...message, isRead: Boolean(isRead) } : message
        )
      );
    });

    socket.on('visit:new', (visit) => {
      setVisitLogs((prev) => {
        const id = getVisitId(visit);
        if (!id || prev.some((item) => getVisitId(item) === id)) return prev;
        return [visit, ...prev].slice(0, 60);
      });
    });

    socket.on('stats:updated', () => {
      fetchStatistics();
    });

    socket.on('subscriber:new', (subscriber) => {
      const timestamp = getItemTimestamp(subscriber) || Date.now();
      if (locationRef.current.includes('/subscribers')) {
        setStoredTimestamp(SUBSCRIBER_SEEN_KEY, timestamp);
        setSubscriberNewCount(0);
        return;
      }
      const lastSeen = getStoredTimestamp(SUBSCRIBER_SEEN_KEY);
      if (timestamp > lastSeen) {
        setSubscriberNewCount((prev) => prev + 1);
      }
    });

    socket.on('review:new', (review) => {
      const timestamp = getItemTimestamp(review) || Date.now();
      if (locationRef.current.includes('/reviews')) {
        setStoredTimestamp(REVIEW_SEEN_KEY, timestamp);
        setReviewNewCount(0);
        return;
      }
      const lastSeen = getStoredTimestamp(REVIEW_SEEN_KEY);
      if (timestamp > lastSeen) {
        setReviewNewCount((prev) => prev + 1);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error?.message || error);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchStatistics]);

  useEffect(() => {
    if (location.pathname.includes('/subscribers')) {
      setStoredTimestamp(SUBSCRIBER_SEEN_KEY, Date.now());
      setSubscriberNewCount(0);
    }
    if (location.pathname.includes('/reviews')) {
      setStoredTimestamp(REVIEW_SEEN_KEY, Date.now());
      setReviewNewCount(0);
    }
  }, [location.pathname]);

  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/messages/${messageToDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessages(messages.filter(message => message._id !== messageToDelete._id));
        setIsDeleteModalOpen(false);
        setMessageToDelete(null);
      } else {
        setError('Failed to delete message');
      }
    } catch (error) {
      setError('Error deleting message');
    }
  };

  const handleMarkRead = async (message) => {
    try {
      const token = localStorage.getItem('adminToken');
      const messageId = message.id || message._id;
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isRead: true })
      });

      if (response.ok) {
        const updated = await response.json();
        setMessages((prev) =>
          prev.map((item) =>
            (item._id || item.id) === (updated._id || updated.id || messageId)
              ? { ...item, isRead: true }
              : item
          )
        );
      } else {
        setError('Failed to update message');
      }
    } catch (error) {
      setError('Error updating message');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') {
      return 'Statistics';
    }
    if (path.includes('/projects')) {
      return 'Projects Management';
    }
    if (path.includes('/hero')) {
      return 'Hero Section Management';
    }
    if (path.includes('/about')) {
      return 'About Section Management';
    }
    if (path.includes('/career')) {
      return 'Career Section Management';
    }
    if (path.includes('/social')) {
      return 'Social Links Management';
    }
    if (path.includes('/profile')) {
      return 'Profile Management';
    }
    if (path.includes('/email-settings')) {
      return 'Email Settings';
    }
    if (path.includes('/subscribers')) {
      return 'Subscribers';
    }
    if (path.includes('/reviews')) {
      return 'Reviews Management';
    }
    if (path.includes('/avatars')) {
      return 'Avatar Library';
    }
    if (path.includes('/statistics')) {
      return 'Statistics';
    }
    if (path.includes('/messages')) {
      return 'Messages';
    }
    return 'Statistics';
  };

  const unreadCount = messages.filter((message) => !message.isRead).length;

  return (
    <div className={`${styles.dashboardContainer} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <Sidebar
        messageCount={unreadCount}
        subscriberCount={subscriberNewCount}
        reviewCount={reviewNewCount}
      />
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <h1>{getPageTitle()}</h1>
          <div className={styles.headerActions}>
            <div className={styles.themeToggle} role="group" aria-label="Theme switch">
              <button
                type="button"
                className={`${styles.themeOption} ${!isMagicTheme ? styles.themeOptionActive : ''}`}
                aria-pressed={!isMagicTheme}
                onClick={() => onToggleTheme && onToggleTheme(false)}
              >
                Simple
              </button>
              <button
                type="button"
                className={`${styles.themeOption} ${isMagicTheme ? styles.themeOptionActive : ''}`}
                aria-pressed={isMagicTheme}
                onClick={() => onToggleTheme && onToggleTheme(true)}
              >
                Magic
              </button>
            </div>
            <div className={styles.userInfo}>
              <span>Welcome, {admin?.username}</span>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <Routes>
            <Route 
              path="/" 
              element={<StatisticsSection stats={statistics} visits={visitLogs} visitsLoading={visitsLoading} />} 
            />
            <Route 
              path="messages/*" 
              element={
                <MessagesSection 
                  messages={messages}
                  isLoading={messagesLoading}
                  error={error}
                  onDeleteClick={handleDeleteClick}
                  onMarkRead={handleMarkRead}
                />
              }
            />
            <Route path="projects/*" element={<ProjectsManagement />} />
            <Route path="about/*" element={<AboutManagement />} />
            <Route path="career/*" element={<CareerManagement />} />
            <Route path="hero/*" element={<HeroManagement />} />
            <Route path="social/*" element={<SocialManagement />} />
            <Route path="profile/*" element={<ProfileManagement />} />
            <Route path="reviews/*" element={<ReviewsManagement />} />
            <Route path="avatars/*" element={<AvatarManagement />} />
            <Route path="email-settings/*" element={<EmailSettings />} />
            <Route path="subscribers/*" element={<SubscribersManagement />} />
            <Route 
              path="statistics/*" 
              element={<StatisticsSection stats={statistics} visits={visitLogs} visitsLoading={visitsLoading} />}
            />
          </Routes>
        </main>

        <DeleteModal 
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setMessageToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
};

export default Dashboard;
