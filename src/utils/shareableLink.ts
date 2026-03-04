import { useCalculatorStore } from '@/store/calculatorStore';

export function encodeStateToURL(): string {
  const state = useCalculatorStore.getState();
  const payload = {
    cp: state.companyProfile,
    wi: state.workforceInputs,
    ri: state.riskInputs,
    deps: state.departments,
    pc: state.pricingConfig,
    sc: state.scenarioType,
    br: state.branding,
  };
  const encoded = btoa(JSON.stringify(payload));
  const url = new URL(window.location.href.split('?')[0]);
  url.searchParams.set('data', encoded);
  return url.toString();
}

export function decodeStateFromURL(): boolean {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');
  if (!data) return false;

  try {
    const payload = JSON.parse(atob(data));
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
