import React from 'react';

interface SocialMediaIconsProps {
  instagramUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
  facebookUrl: string;
}

const SocialMediaIcons: React.FC<SocialMediaIconsProps> = ({ instagramUrl, tiktokUrl, twitterUrl, facebookUrl }) => {
  return (
    <div className="flex space-x-2">
      <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
        <img src="/instagram.png" alt="Instagram" className="w-8 h-8 rounded-full" />
      </a>
      <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
        <img src="/tiktok.png" alt="TikTok" className="w-8 h-8 rounded-full" />
      </a>
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
        <img src="/twitter.png" alt="Twitter" className="w-8 h-8 rounded-full" />
      </a>
      <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
        <img src="/facebook.png" alt="Facebook" className="w-8 h-8 rounded-full" />
      </a>
    </div>
  );
};

export default SocialMediaIcons;
