'use client';

import React from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const promoCards = [
  { icon: '📚', title: 'Trading Courses', detail: 'Coming Soon' },
  { icon: '👕', title: 'Merch Store', detail: 'Coming Soon' },
  { icon: '💎', title: 'VIP Membership', detail: 'Coming Soon' },
];

const NewShopModal = ({ open, onClose }: Props) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-hub" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0a0a0c 0%, #151518 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: 700 }}>🛒 BullMoney Shop</h2>
          <p
            style={{
              fontSize: '1.2rem',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '40px',
              maxWidth: '500px',
            }}
          >
            Premium trading merchandise, courses, and exclusive VIP access coming soon.
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {promoCards.map((card) => (
              <div
                key={card.title}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '30px',
                  width: '200px',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>{card.icon}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>{card.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewShopModal;
