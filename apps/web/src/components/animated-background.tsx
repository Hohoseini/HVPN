export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-50" />
      <div className="absolute -left-40 top-[-15%] h-[26rem] w-[26rem] rounded-full bg-main/25 blur-[100px] animate-[drift1_26s_ease-in-out_infinite] sm:h-[32rem] sm:w-[32rem]" />
      <div className="absolute right-[-18%] top-1/4 h-[28rem] w-[28rem] rounded-full bg-sky-400/20 blur-[110px] animate-[drift2_32s_ease-in-out_infinite] sm:h-[34rem] sm:w-[34rem]" />
      <div className="absolute bottom-[-22%] left-1/4 h-[24rem] w-[24rem] rounded-full bg-fuchsia-400/15 blur-[100px] animate-[drift3_36s_ease-in-out_infinite] sm:h-[30rem] sm:w-[30rem]" />
      <div className="absolute left-[58%] top-[6%] h-64 w-64 rounded-full bg-lime-300/15 blur-[90px] animate-[drift2_28s_ease-in-out_infinite_reverse] sm:h-80 sm:w-80" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg/60" />
    </div>
  );
}
