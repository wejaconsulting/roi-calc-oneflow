import { useCalculatorStore } from '@/store/calculatorStore';

function toBase64(str: string): string {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  ));
}

function fromBase64(str: string): string {
  return decodeURIComponent(
    Array.from(atob(str), (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  );
}

export function encodeStateToURL(): string {
  const state = useCalculatorStore.getState();
  const payload = {
    cp: state.companyProfile,
    wi: state.workforceInputs,
    ri: state.riskInputs,
    deps: state.departments,
    pc: state.pricingConfig,
    sc: state.scenarioType,
    br: { companyName: state.branding.companyName, primaryColor: state.branding.primaryColor },
  };
  const encoded = toBase64(JSON.stringify(payload));
  const url = new URL(window.location.href.split('?')[0]);
  url.searchParams.set('data', encoded);
  return url.toString();
}

export function decodeStateFromURL(): boolean {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');
  if (!data) return false;

  try {
    const payload = JSON.parse(fromBase64(data));
    const store = useCalculatorStore.getState();

    if (payload.cp) store.setCompanyProfile(payload.cp);
    if (payload.wi) store.setWorkforceInputs(payload.wi);
    if (payload.ri) store.setRiskInputs(payload.ri);
    if (payload.deps) store.setDepartments(payload.deps);
    if (payload.pc) store.setPricingConfig(payload.pc);
    if (payload.sc) store.setScenarioType(payload.sc);
    if (payload.br) store.setBranding(payload.br);

    return true;
  } catch {
    return false;
  }
}

export async function copyShareableLink(): Promise<boolean> {
  const url = encodeStateToURL();
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
