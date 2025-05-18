import { useRef, useState } from "react";

interface Props {
  axis: "x" | "y";
  onScroll: (delta: number) => void;
  thumbRef: React.RefObject<HTMLDivElement | null>;
}

export default function ScrollBar({ axis, onScroll, thumbRef }: Props) {
  const [pointerId, setPointerId] = useState<number | null>(null);
  const scrollPosition = useRef({
    curr: { x: 0, y: 0 },
    prev: { x: 0, y: 0 },
  });

  const isVertical = axis === "y";

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    const { pointerId, pageX, pageY, currentTarget } = event;
    currentTarget.setPointerCapture(pointerId);
    scrollPosition.current.curr.x = pageX;
    scrollPosition.current.curr.y = pageY;
    setPointerId(pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (pointerId === null) return;

    const { pageX, pageY } = event;
    const prev = scrollPosition.current.curr;
    const curr = { x: pageX, y: pageY };
    scrollPosition.current.curr = curr;

    const delta = isVertical ? curr.y - prev.y : curr.x - prev.x;
    onScroll(delta);
  };

  const handlePointerUp = () => {
    if (pointerId === null) return;
    thumbRef.current?.releasePointerCapture(pointerId);
    setPointerId(null);
  };

  return (
    <div
      className={`absolute flex justify-center bg-white z-50 ${
        isVertical
          ? `w-[12px] h-[calc(100% - 12px)] right-0 top-0`
          : `h-[12px] w-[calc(100% - 12px)] left-0 bottom-0`
      }`}
    >
      <div
        ref={thumbRef}
        className={`absolute bg-zinc-500 rounded-full cursor-pointer ${
          isVertical
            ? `left-1/2 -translate-x-1/2 w-[90%] h-[48px]`
            : `top-1/2 -translate-y-1/2 w-[48px] h-[90%]`
        }`}
        style={isVertical ? { top: "0px" } : { left: "0px" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      ></div>
    </div>
  );
}
