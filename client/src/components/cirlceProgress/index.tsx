import React from 'react';

const CircleProgress: React.FC<{
    percent: number;
}> = ({ percent }) => {
    const getStrokeColor = (percent : number) => {
        if (percent <= 50) return 'stroke-red-500'; // Red color for <= 50%
        if (percent <= 75) return 'stroke-yellow-500'; // Yellow color for 51%-75%
        return 'stroke-green-500'; // Green color for > 75%
    };

    const getFontColor = (percent : number) => {
        if (percent <= 50) return 'red'; // Red color for <= 50%
        if (percent <= 75) return 'yellow'; // Yellow color for 51%-75%
        return 'green'; // Green color for > 75%
    };

    const getBackgroundColor = (percent:number) => {
        if (percent <= 50) return 'bg-red-100'; // Light red background for <= 50%
        if (percent <= 75) return 'bg-yellow-100'; // Light yellow background for 51%-75%
        return 'bg-green-100'; // Light green background for > 75%
    };

    const strokeColor = getStrokeColor(percent);
    const backgroundColor = getBackgroundColor(percent);
    const fontColor = getFontColor(percent);

    return (
        <div className={`flex relative items-center justify-center ${backgroundColor} rounded-full`} style={{ width: '48px', height: '48px' }}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="-1 -1 34 34"
                className="-rotate-90"
                width={80}
            >
                <circle
                    cx="16"
                    cy="16"
                    r="15.9155"
                    fill="none"
                    className="stroke-blue-800/5 relative"
                    strokeWidth="1.8"
                />

                <circle
                    cx="16"
                    cy="16"
                    r="15.9155"
                    fill="none"
                    className={`${strokeColor}`}
                    strokeDasharray="100 100"
                    strokeDashoffset={100 - percent}
                    strokeLinecap="round"
                    strokeWidth="1.8"
                />
            </svg>
            <p className={`absolute text-${fontColor}-600 text-[12px] flex flex-col items-center justify-center width-[100%] font-bold`}>
                {percent}%<span className="text-[9px] font-normal">match</span>
            </p>
        </div>
    );
};

export default CircleProgress;
