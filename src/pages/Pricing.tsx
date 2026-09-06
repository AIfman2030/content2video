import SiteHeader from '@/components/commerce/SiteHeader';
import PlanGrid from '@/components/commerce/PlanGrid';

export default function Pricing() {
  return <div className="commercial-page"><SiteHeader /><main className="standalone-page"><div className="section-heading standalone-heading"><h1>选择创作计划</h1><p>付款成功后自动开通。订阅可以随时在账户中管理。</p></div><PlanGrid /></main></div>;
}
