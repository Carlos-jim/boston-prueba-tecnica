export const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
};

export const formatTime = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatRelativeTime = (timestamp) => {
  const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (diff < 5) return "Ahora mismo";
  if (diff < 60) return `hace ${diff}s`;
  return `hace ${Math.floor(diff / 60)}m`;
};

export const formatShortNumber = (num) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toFixed(0);
};

export const formatDay = (dateStr) => {
  // Asegurar que la fecha se interprete como local añadiendo T00:00:00 si es solo YYYY-MM-DD
  // Esto evita que '2025-01-01' se interprete como UTC (que sería 31 Dic en América)
  const safeDateStr = dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`;
  const date = new Date(safeDateStr);
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const formatUpdateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("es-ES", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
