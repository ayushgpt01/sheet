import createSheet from "@/services/createSheet";
import deleteSheet from "@/services/deleteSheet";
import duplicateSheet from "@/services/duplicateSheet";
import getSheetsList from "@/services/getSheetsList";
import updateSheet from "@/services/updateSheet";
import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CheckIcon from "@mui/icons-material/Check";
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

const ITEM_HEIGHT = 36;

export default function SheetsList() {
  const { sheetId } = useParams();
  const navigate = useNavigate();

  const initialized = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [sheets, setSheets] = useState<SheetsListItem[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [anchorElSheetMenu, setAnchorElSheetMenu] =
    useState<null | HTMLElement>(null);
  const [sheetListMenu, setSheetListMenu] = useState<null | HTMLElement>(null);
  const [showEditor, setShowEditor] = useState(false);

  const openSheetMenu = Boolean(anchorElSheetMenu);
  const openSheetMenuList = Boolean(sheetListMenu);

  useEffect(() => {
    if (!activeItemRef.current) return;

    activeItemRef.current.scrollIntoView({ behavior: "smooth" });
  }, [sheetId]);

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
    }, 8);
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
          onClick={async () => {
            try {
              const sheetItem = await createSheet({
                name: `Sheet ${sheets.length + 1}`,
              });
              setSheets((prev) => [...prev, sheetItem]);
              navigate(`/sheet/${sheetItem.id}`);
            } catch (error) {
              console.error(error);
            }
          }}
        >
          <AddIcon fontWeight={300} sx={{ color: "#686a6b", fontSize: 18 }} />
        </Button>
        <Button
          className='!h-[24px] !p-3.5 !max-w-[24px] !min-w-[24px] !shrink-0 !grow-0 
          !rounded-full hover:!text-[#1f1f1f] hover:!bg-[#e1e3e6]'
          onClick={(e) => {
            e.stopPropagation();
            setSheetListMenu(e.currentTarget);
          }}
        >
          <MenuIcon fontWeight={300} sx={{ color: "#686a6b", fontSize: 18 }} />
        </Button>
        <Menu
          id='sheet-list-menu'
          anchorEl={sheetListMenu}
          open={openSheetMenuList}
          onClose={() => setSheetListMenu(null)}
          slotProps={{
            list: { "aria-labelledby": "sheets-list" },
            transition: Fade,
            paper: {
              style: {
                maxHeight: ITEM_HEIGHT * 5,
              },
            },
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
          {sheets.map((v) => {
            const isActive = String(v.id) === String(sheetId);
            return (
              <MenuItem
                key={v.id}
                selected={isActive}
                onClick={() => {
                  setSheetListMenu(null);
                  navigate(`/sheet/${v.id}`);
                }}
              >
                {isActive && (
                  <CheckIcon
                    fontWeight={300}
                    sx={{ color: "#686a6b", fontSize: 18 }}
                    className='mr-2.5'
                  />
                )}
                <span className={`${!isActive ? "ml-7" : ""}`}>{v.name}</span>
              </MenuItem>
            );
          })}
        </Menu>
      </div>
      <div
        ref={scrollRef}
        className='w-[calc(100vw-220px)] overflow-x-auto whitespace-nowrap px-3
        flex items-center no-scrollbar'
      >
        {sheets.map((v, idx) => {
          const isActive = String(v.id) === String(sheetId);
          return (
            <div
              className={`flex items-center min-w-fit max-w-max p-0.5 text-sm border ${
                isActive
                  ? `text-[#0b57d0] font-bold border-[#cfdff6] bg-[#cfdff6]`
                  : `text-[#444746] cursor-pointer font-medium border-[#f9fbfd] hover:bg-[#e1e3e6] hover:text-[#1f1f1f]`
              }`}
              key={v.id}
              ref={isActive ? activeItemRef : undefined}
              onClick={() => {
                if (!isActive) navigate(`/sheet/${v.id}`);
              }}
              onDoubleClick={() => {
                if (isActive) setShowEditor(true);
              }}
            >
              {/* Double click input */}
              {showEditor && isActive ? (
                <input
                  ref={inputRef}
                  className='text-[#444746] p-1 outline-[#0b57d0] max-w-fit'
                  type='text'
                  defaultValue={v.name}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (e.ctrlKey) {
                        return;
                      }
                      e.currentTarget.blur();
                    }
                  }}
                  onBlur={async (e) => {
                    const value = e.target.value;
                    if (!value.trim()) {
                      e.preventDefault();
                      return;
                    }

                    try {
                      const isUpdated = await updateSheet({
                        id: v.id,
                        name: value,
                      });

                      if (isUpdated) {
                        setSheets((prev) =>
                          prev.map((val) =>
                            String(val.id) === String(v.id)
                              ? { ...val, name: value }
                              : val
                          )
                        );
                      }
                    } catch (error) {
                      console.error(error);
                    } finally {
                      setShowEditor(false);
                    }
                  }}
                />
              ) : (
                <>
                  <span className='px-2 py-1 whitespace-nowrap'>{v.name}</span>
                  <Button
                    id={`${v.id}_menu_btn`}
                    className={`!min-w-0 !w-5 !h-5 !p-0 !ml-1 !shrink-0 !grow-0 
                    !rounded-full ${isActive ? "hover:!bg-[#4447461f]" : ""}`}
                    aria-controls={
                      openSheetMenu && isActive ? "basic-menu" : undefined
                    }
                    aria-haspopup={isActive ? "true" : "false"}
                    aria-expanded={
                      openSheetMenu && isActive ? "true" : undefined
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnchorElSheetMenu(e.currentTarget);
                    }}
                    disabled={!isActive}
                  >
                    <ArrowDropDownIcon
                      fontWeight={300}
                      sx={{
                        color: isActive ? "#0b57d0" : "#444746",
                        fontSize: 18,
                      }}
                    />
                  </Button>
                </>
              )}
              {isActive && (
                <Menu
                  id='sheet-context-menu'
                  anchorEl={anchorElSheetMenu}
                  open={openSheetMenu}
                  onClose={() => setAnchorElSheetMenu(null)}
                  slotProps={{
                    list: { "aria-labelledby": "sheet-context-button" },
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
                  <MenuItem
                    className={`${String(v.id) === "1" ? "hidden" : ""}`}
                    onClick={async () => {
                      try {
                        const isDeleted = await deleteSheet(v.id);
                        if (isDeleted) {
                          setSheets((prev) =>
                            prev.filter((sheet) => sheet.id !== v.id)
                          );
                          setAnchorElSheetMenu(null);
                          if (sheets.length > 1) {
                            const nextSheet = sheets[idx - 1];
                            if (nextSheet) {
                              navigate(`/sheet/${nextSheet.id}`);
                            }
                          }
                        }
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                  >
                    Delete
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      try {
                        const duplicatedSheet = await duplicateSheet(v.id);
                        setSheets((prev) => [...prev, duplicatedSheet]);
                        setAnchorElSheetMenu(null);
                        navigate(`/sheet/${duplicatedSheet.id}`);
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                  >
                    Duplicate
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setShowEditor(true);
                      setAnchorElSheetMenu(null);
                    }}
                  >
                    Rename
                  </MenuItem>
                  {/* <MenuItem>Move Left</MenuItem>
                  <MenuItem>Move Right</MenuItem> */}
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
