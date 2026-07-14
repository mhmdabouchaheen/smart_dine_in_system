import { useState } from 'react';
import { useCart } from '../../context/cartContextValue';
import { checkStock } from '../../services/api';
// Storage and Session imports
import { listOrders } from '../../services/ordersStore';
import { getCurrentTableId } from '../../utils/session'; 

export type Stage = 'items' | 'method' | 'card' | 'receipt' | 'placed';

export const useOrderDrawerLogic = () => {
  const { items, totalPrice, submitOrder, ...cart } = useCart();
  
  // State
  const [stage, setStage] = useState<Stage>('items');
  const [isProcessing, setProcessing] = useState(false);
  const [stockIssues, setStockIssues] = useState<string[]>([]);
  const [isCheckingStock, setCheckingStock] = useState(false);

  // --- Filtering Logic ---
  // We fetch the table ID and filter the orders list immediately
  const tableId = getCurrentTableId();
  const myOrders = listOrders(tableId ?? '');
  
  // Handler functions
  async function goToCheckout() {
    if (items.length === 0) return;
    setCheckingStock(true);
    try {
      const result = await checkStock(items.map((i) => ({ menuItemId: i._id, name: i.name, qty: i.qty, price: i.price })));
      if (!result.ok) {
        setStockIssues(result.issues.map(issue => `${issue.menuItemName}: needs...`));
        return;
      }
      setStage('method');
    } finally { setCheckingStock(false); }
  }

  return {
    stage, 
    setStage, 
    isProcessing, 
    setProcessing, 
    items, 
    totalPrice, 
    submitOrder, 
    goToCheckout, 
    stockIssues, 
    isCheckingStock,
    myOrders, // Now available to your UI
    ...cart
  };
};
