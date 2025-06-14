export function InitLoader() {
  return (
    <div className='flex h-screen w-screen items-center justify-center'>
      <div className='flex w-6/12 flex-col items-center justify-center gap-4'>
        {/* <!-- Logo --> */}
        <svg
          className='animate fade 4s infinite, spin 6s linear infinite ease-in-out'
          fill='#fff'
          height='96'
          viewBox='0 0 96 96'
          width='96'
        >
          <polygon points='36.703,11.011 9.638,26.636 9.638,38.757 36.703,23.131 63.767,38.757 63.767,26.636   ' />
          <polygon points='63.298,89.092 36.233,73.467 36.233,61.348 63.298,76.973 90.362,61.348 90.362,73.467   ' />
          <polygon points='9.638,42.012 36.703,26.386 47.198,32.446 20.134,48.072 20.134,79.324 9.638,73.264   ' />
          <polygon points='77.083,18.872 50.018,3.247 39.522,9.307 66.586,24.932 66.586,56.184 77.083,50.124   ' />
          <polygon points='23.01,81.127 23.011,49.876 33.507,43.816 33.507,75.068 60.571,90.693 50.075,96.754   ' />
          <polygon points='90.362,58.092 90.362,26.84 79.866,20.78 79.866,52.031 52.802,67.658 63.298,73.719   ' />
        </svg>
      </div>
    </div>
  );
}
