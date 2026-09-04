import React from 'react';
import Icon from './Icon';

export const KpiCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  badge,
  onClick,
  className = '',
  loading = false
}) => {
  return (
    <div
      className={`kpi-card kpi-card--${color} ${onClick ? 'cursor-pointer hover-lift' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}
    >
      <div className="kpi-card__header">
        <span className="kpi-card__title">{title}</span>
        {icon && (
          <div className={`kpi-card__icon-wrapper bg-${color}-subtle text-${color}`}>
            <Icon name={icon} size={22} />
          </div>
        )}
      </div>

      <div className="kpi-card__body">
        {loading ? (
          <div className="skeleton-line" style={{ width: '60%', height: '28px', margin: '4px 0' }}></div>
        ) : (
          <div className="kpi-card__value">{value ?? '-'}</div>
        )}
      </div>

      {(subtitle || badge) && (
        <div className="kpi-card__footer">
          {badge && <span className={`badge badge--${color}`}>{badge}</span>}
          {subtitle && <span className="kpi-card__subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
