export interface ProcessCostResult {
  processId: string;
  label: string;
  cost: number;
  enabled: boolean;
  details: {
    formula: string;
    steps: { label: string; value: string | number }[];
  };
}

export interface IronCostBreakdown {
  processes: ProcessCostResult[];
  totalIronCost: number;
}

export interface PricingResult {
  ironCost: number;
  handlePrice: number;
  printingFee: number;
  handleCost: number;  // iron + handle + printing
  packagingCost: number;
  boxCost: number;
  shippingCost: number;
  totalCost: number;
  adjustedCost: number;  // × price markup
  afterTax: number;      // × tax rate
  sellingPrice: number;  // × profit rate
  profit: number;
  usdPrice: number;
}

export interface GlobalParams {
  density_round: number;
  density_hex: number;
  density_square: number;
  tax_rate: number;
  profit_bulk: number;
  profit_tag: number;
  printing_fee: number;
  bulk_packaging: number;
  tag_sticker: number;
  box_markup: number;
  shipping_markup: number;
  exchange_rate: number;
  price_markup: number;
  [key: string]: number;
}

export interface Product {
  id: number;
  sku: string;
  wire_diameter: number;
  exposed_length: number;
  internal_length: number;
  material_shape: string;
  steel_type: string;
  handle_size: string | null;
  handle_model: string | null;
  packaging_type: string;
  carton_quantity: number | null;
  has_hex_ring: number;
  has_through_head: number;
  has_tp_drill: number;
  has_stamp: number;
  notes: string | null;
}
