import { Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { BorrowPage } from "./pages/BorrowPage";
import { DeskPage } from "./pages/DeskPage";
import { GovernancePage } from "./pages/GovernancePage";
import { MarketPage } from "./pages/MarketPage";
import { MarketsPage } from "./pages/MarketsPage";
import { PositionPage } from "./pages/PositionPage";

export function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<DeskPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/markets/:id" element={<MarketPage />} />
        <Route path="/borrow" element={<BorrowPage />} />
        <Route path="/position" element={<PositionPage />} />
        <Route path="/governance" element={<GovernancePage />} />
      </Routes>
    </Shell>
  );
}
