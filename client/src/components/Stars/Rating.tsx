// components/Rating.tsx
import React from 'react';
import Star from './Star';
import SocialMediaIcons from '../SocialMedia/SocialMediaIcons';

interface RatingProps {
  rating: number;
  reviews: number;
  instagramUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
  facebookUrl: string;
}

const Rating: React.FC<RatingProps> = ({ rating, reviews, instagramUrl, tiktokUrl, twitterUrl, facebookUrl }) => {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Star key={i} filled />);
      } else if (rating >= i - 0.5) {
        stars.push(<Star key={i} half />);
      } else {
        stars.push(<Star key={i} />);
      }
    }
    return stars;
  };

  return (
    <div className="flex items-center justify-between bg-background dark:bg-lightForeground p-4 rounded-2xl w-full">
      <div className="flex items-center">
        <span className="text-[32px] font-bold text-rating">{rating.toFixed(1)}</span>
        <div>
        <div className="flex items-center ml-2 mb-1">
          {renderStars(rating)}
        </div>
        <div className="ml-2 text-sm text-black dark:text-white font-medium">Based on {reviews} reviews</div>
        </div>
      </div>
      <SocialMediaIcons
        instagramUrl={instagramUrl}
        tiktokUrl={tiktokUrl}
        twitterUrl={twitterUrl}
        facebookUrl={facebookUrl}
      />
    </div>
  );
};

export default Rating;
