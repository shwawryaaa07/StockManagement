import React from 'react';

function EmptyState({
    icon = '📋',
    title = 'No Data Found',
    description = 'There are no records matching your request right now.',
    actionLabel,
    onAction,
    secondaryLabel,
    onSecondaryAction,
    style = {}
}) {
    return (
        <div className="empty-state-card" style={style} role="region" aria-label={title}>
            <div className="empty-state-icon-wrapper">
                <span className="empty-state-icon">{icon}</span>
            </div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-desc">{description}</p>
            {(actionLabel || secondaryLabel) && (
                <div className="empty-state-actions">
                    {actionLabel && (
                        <button
                            type="button"
                            onClick={onAction}
                            className="btn-primary empty-state-btn"
                        >
                            {actionLabel}
                        </button>
                    )}
                    {secondaryLabel && (
                        <button
                            type="button"
                            onClick={onSecondaryAction}
                            className="btn-secondary empty-state-btn"
                        >
                            {secondaryLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default EmptyState;
