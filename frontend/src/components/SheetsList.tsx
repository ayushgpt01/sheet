import getSheetsList from "@/services/getSheetsList";
import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuIcon from "@mui/icons-material/Menu";
import Button from "@mui/material/Button";
import Fade from "@mui/material/Fade";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

export default function SheetsList() {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<SheetsListItem[]>([]);
  const initialized = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (initialized.current) return;
    getSheetsList()
      .then((data) => {
        setSheets(data);
      })
      .catch((e) => {
        console.error(e);
      });
    initialized.current = true;
  }, []);

  useEffect(() => {
    const checkScroll = debounce(() => {
      const el = scrollRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, 12);
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll);
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
    };
  }, [sheets]);

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 150;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className='h-[36px] flex items-center ms-16 bg-[#f9fbfd] select-none'>
      <div className='flex items-center gap-5'>
        <Button
          className='!h-[24px] !p-3 !max-w-[24px] !min-w-[24px] !shrink-0 !grow-0 
          !rounded-full hover:!text-[#1f1f1f] hover:!bg-[#e1e3e6]'
        >
          <AddIcon fontWeight={300} sx={{ color: "#686a6b", fontSize: 18 }} />
        </Button>
        <Button
          className='!h-[24px] !p-3.5 !max-w-[24px] !min-w-[24px] !shrink-0 !grow-0 
          !rounded-full hover:!text-[#1f1f1f] hover:!bg-[#e1e3e6]'
        >
          <MenuIcon fontWeight={300} sx={{ color: "#686a6b", fontSize: 18 }} />
        </Button>
      </div>
      <div
        ref={scrollRef}
        className='w-[calc(100vw-220px)] overflow-x-auto whitespace-nowrap px-3
        flex items-center no-scrollbar'
      >
        {sheets.map((v) => {
          const isActive = String(v.id) === String(sheetId);
          return (
            <div
              className={`flex items-center min-w-fit max-w-max p-0.5 text-sm border ${
                isActive
                  ? `text-[#0b57d0] font-bold border-[#cfdff6] bg-[#cfdff6]`
                  : `text-[#444746] cursor-pointer font-medium border-[#f9fbfd] hover:bg-[#e1e3e6] hover:text-[#1f1f1f]`
              }`}
              key={v.id}
              onClick={() => {
                if (!isActive) navigate(`/sheet/${v.id}`);
              }}
            >
              {/* Double click input */}
              <span className='px-2 py-1 whitespace-nowrap'>{v.name}</span>
              <Button
                id={`${v.id}_menu_btn`}
                className={`!min-w-0 !w-5 !h-5 !p-0 !ml-1 !shrink-0 !grow-0 
                !rounded-full ${isActive ? "hover:!bg-[#4447461f]" : ""}`}
                aria-controls={open && isActive ? "basic-menu" : undefined}
                aria-haspopup={isActive ? "true" : "false"}
                aria-expanded={open && isActive ? "true" : undefined}
                onClick={handleClick}
                disabled={!isActive}
              >
                <ArrowDropDownIcon
                  fontWeight={300}
                  sx={{ color: isActive ? "#0b57d0" : "#444746", fontSize: 18 }}
                />
              </Button>
              {isActive && (
                <Menu
                  id='basic-menu'
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  slotProps={{
                    list: { "aria-labelledby": "basic-button" },
                    transition: Fade,
                  }}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "center",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                  }}
                >
                  <MenuItem onClick={handleClose}>Delete</MenuItem>
                  <MenuItem onClick={handleClose}>Duplicate</MenuItem>
                  <MenuItem onClick={handleClose}>Rename</MenuItem>
                  <MenuItem onClick={handleClose}>Move Left</MenuItem>
                  <MenuItem onClick={handleClose}>Move Right</MenuItem>
                </Menu>
              )}
            </div>
          );
        })}
      </div>
      <div className='flex gap-5'>
        <Button
          disabled={!canScrollLeft}
          onClick={() => scrollBy("left")}
          className='!h-[20px] !p-3 !max-w-[20px] !min-w-[20px] !shrink-0 !grow-0 
          !rounded-full hover:!text-[#1f1f1f] hover:!bg-[#e1e3e6]'
        >
          <ChevronLeftIcon
            fontWeight={300}
            sx={{
              color: canScrollLeft ? "#686a6b" : "#00000042",
              fontSize: 22,
            }}
          />
        </Button>
        <Button
          disabled={!canScrollRight}
          onClick={() => scrollBy("right")}
          className='!h-[20px] !p-3 !max-w-[20px] !min-w-[20px] !shrink-0 !grow-0 
          !rounded-full hover:!text-[#1f1f1f] hover:!bg-[#e1e3e6]'
        >
          <ChevronRightIcon
            fontWeight={300}
            sx={{
              color: canScrollRight ? "#686a6b" : "#00000042",
              fontSize: 22,
            }}
          />
        </Button>
      </div>
    </div>
  );
}
