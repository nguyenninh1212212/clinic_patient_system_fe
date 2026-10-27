import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { aiChatApi, type ChatResponse } from "@/api/endpoints/ai-chat.api";
import { useAppDispatch } from "@/store";
import { ChatDoctorRecommendations } from "./ChatDoctorRecommendations";
import { setSelectedDoctorForBooking } from "@/store/slices/profileSlice";
import type { DoctorDTO } from "@/types";
import { setCurrentTab, showRealtimeToast } from "@/store/slices/uiSlice";

type Message = {
  role: "user" | "assistant";
  text: string;
  response?: ChatResponse;
};
const welcome: Message = {
  role: "assistant",
  text: "Xin chào! Bạn đang gặp triệu chứng gì? Hãy mô tả để tôi hỏi thêm và hỗ trợ tìm khoa khám phù hợp.",
};

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
  }
  return "Chưa nhận được phản hồi từ trợ lý. Vui lòng kiểm tra kết nối và thử lại.";
}

export function PatientChatWidget() {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);
  const busy = useRef(false);
  const mounted = useRef(true);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (open)
      end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, pending, open]);

  async function send() {
    const text = draft.trim();
    if (!text || text.length > 2000 || busy.current || finished) return;
    busy.current = true;
    setPending(true);
    setError(null);
    setDraft("");
    setMessages((previous) => [...previous, { role: "user", text }]);
    try {
      conversationId.current ??= crypto.randomUUID();
      const response = await aiChatApi.send(text, conversationId.current);
      if (!mounted.current) return;
      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: response.message, response },
      ]);
      setFinished(
        response.finished ||
          response.status === "completed" ||
          response.status === "emergency",
      );
      if (response.booking_recommendation) {
        dispatch(
          showRealtimeToast({
            title: "Đã có kết quả tư vấn khoa khám",
            message: response.booking_recommendation.message,
            type: "SYSTEM",
          }),
        );
      } else if (response.finished && response.status !== "emergency") {
        dispatch(
          showRealtimeToast({
            title: "Đã hoàn tất tư vấn",
            message:
              "Kết quả đã có trong khung chat. Vui lòng xem hướng dẫn về khoa khám.",
            type: "SYSTEM",
          }),
        );
      }
    } catch (error) {
      if (!mounted.current) return;
      setError(errorMessage(error));
      setDraft(text);
      // Keep the failed turn in the composer so the patient can retry or edit it.
      setMessages((previous) => previous.slice(0, -1));
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  async function reset() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      if (conversationId.current) await aiChatApi.reset(conversationId.current);
      if (!mounted.current) return;
      conversationId.current = undefined;
      setMessages([welcome]);
      setDraft("");
      setFinished(false);
    } catch (error) {
      if (mounted.current) setError(errorMessage(error));
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  function selectDoctor(doctor: DoctorDTO) {
    dispatch(setSelectedDoctorForBooking(doctor));
    dispatch(setCurrentTab("booking"));
    setOpen(false);
    dispatch(
      showRealtimeToast({
        title: "Đã chọn bác sĩ",
        message: `Bạn đã chọn ${doctor.user.fullName} · ${doctor.specialty.name}. Vui lòng chọn hồ sơ, ngày và giờ khám để xác nhận đặt lịch.`,
        type: "APPOINTMENT",
      }),
    );
  }

  return (
    <>
      {!open && (
        <Fab
          color="primary"
          variant="extended"
          onClick={() => setOpen(true)}
          aria-label="Mở trợ lý tìm khoa khám"
          sx={{
            position: "fixed",
            bottom: { xs: 20, sm: 28 },
            right: { xs: 16, sm: 28 },
            zIndex: 1200,
            gap: 1,
          }}
        >
          <ChatOutlinedIcon /> Tìm khoa khám
        </Fab>
      )}
      {open && (
        <Paper
          role="dialog"
          aria-label="Trợ lý tìm khoa khám"
          elevation={12}
          sx={{
            position: "fixed",
            right: { xs: 8, sm: 28 },
            bottom: { xs: 8, sm: 28 },
            width: { xs: "calc(100vw - 16px)", sm: 400 },
            maxWidth: "100%",
            height: "min(650px, calc(100dvh - 24px))",
            zIndex: 1200,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 3,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              p: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <ChatOutlinedIcon />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>
                Trợ lý tìm khoa khám
              </Typography>
              <Typography variant="caption">
                Hỗ trợ theo triệu chứng của bạn
              </Typography>
            </Box>
            <Tooltip title="Cuộc trò chuyện mới">
              <span>
                <IconButton
                  color="inherit"
                  disabled={pending}
                  onClick={() => void reset()}
                  aria-label="Bắt đầu cuộc trò chuyện mới"
                >
                  <RestartAltIcon />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton
              color="inherit"
              onClick={() => setOpen(false)}
              aria-label="Thu gọn khung chat"
            >
              <CloseIcon />
            </IconButton>
          </Stack>
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: "grey.50",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Gợi ý khoa khám chỉ mang tính tham khảo, không thay thế thăm khám.
              Nếu cần cấp cứu, hãy đến cơ sở y tế ngay.
            </Typography>
          </Box>
          <Stack
            role="log"
            aria-label="Nội dung trò chuyện"
            aria-live="polite"
            spacing={2}
            sx={{ p: 2, flex: 1, minHeight: 0, overflowY: "auto" }}
          >
            {messages.map((message, index) => {
              const response = message.response;
              const triage = response?.department_triage;
              return (
                <Box
                  key={index}
                  sx={{
                    alignSelf:
                      message.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "95%",
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor:
                        message.role === "user" ? "primary.main" : "grey.100",
                      color:
                        message.role === "user"
                          ? "primary.contrastText"
                          : "text.primary",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {message.role === "user" ? "Bạn" : "Trợ lý"}
                    </Typography>
                    {response?.status === "emergency" ? (
                      <Alert
                        severity="error"
                        sx={{ mt: 1, whiteSpace: "pre-wrap" }}
                      >
                        {message.text}
                      </Alert>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {message.text}
                      </Typography>
                    )}
                    {triage && response?.status !== "emergency" && (
                      <Box sx={{ mt: 1.5 }}>
                        {triage.status === "suggested" &&
                        triage.suggested_department ? (
                          <>
                            <Alert severity="info">
                              Khoa gợi ý:{" "}
                              <strong>{triage.suggested_department}</strong>
                            </Alert>
                            {!response.booking_recommendation && (
                              <Button
                                size="small"
                                sx={{ mt: 1 }}
                                onClick={() => {
                                  dispatch(setCurrentTab("doctors"));
                                  setOpen(false);
                                }}
                              >
                                Xem bác sĩ và chuyên khoa
                              </Button>
                            )}
                          </>
                        ) : (
                          <Alert severity="info">
                            {triage.status === "ambiguous"
                              ? "Có nhiều khoa có thể phù hợp. Bạn nên nhờ nhân viên y tế hướng dẫn thêm."
                              : "Chưa đủ thông tin để gợi ý khoa khám. Bạn nên liên hệ nhân viên y tế để được hướng dẫn."}
                          </Alert>
                        )}
                      </Box>
                    )}
                    {response?.booking_recommendation &&
                      response.status !== "emergency" && (
                        <ChatDoctorRecommendations
                          recommendation={response.booking_recommendation}
                          onSelect={selectDoctor}
                          onViewDoctors={() => {
                            dispatch(setCurrentTab("doctors"));
                            setOpen(false);
                          }}
                        />
                      )}
                    {response?.warning && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: "block" }}
                      >
                        Trợ lý đang dùng câu hỏi mẫu để tiếp tục hỗ trợ bạn.
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
            {pending && (
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center" }}
                role="status"
              >
                <CircularProgress size={16} />
                <Typography variant="caption">Đang xử lý…</Typography>
              </Stack>
            )}
            <div ref={end} />
          </Stack>
          {error && (
            <Alert severity="error" sx={{ mx: 2, mb: 1 }} role="alert">
              {error}
            </Alert>
          )}
          {finished ? (
            <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => void reset()}
                disabled={pending}
              >
                Bắt đầu cuộc trò chuyện mới
              </Button>
            </Box>
          ) : (
            <Box
              component="form"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
              sx={{ p: 2, borderTop: 1, borderColor: "divider" }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "flex-start" }}
              >
                <TextField
                  autoFocus
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={4}
                  size="small"
                  label="Mô tả triệu chứng"
                  placeholder="Ví dụ: Tôi bị đau đầu từ sáng nay…"
                  value={draft}
                  disabled={pending}
                  slotProps={{ htmlInput: { maxLength: 2000 } }}
                  helperText={`${draft.length}/2000 · Enter để gửi, Shift+Enter xuống dòng`}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                />
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={pending || !draft.trim()}
                  aria-label="Gửi triệu chứng"
                >
                  <SendIcon />
                </IconButton>
              </Stack>
            </Box>
          )}
        </Paper>
      )}
    </>
  );
}
