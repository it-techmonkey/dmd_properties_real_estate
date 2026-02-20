import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/router';

function SelectionButton({ option, isSelected, onClick, layout }) {
  const isHorizontal = layout === 'horizontal';
  
  return (
    <button
      type="button"
      onClick={() => onClick(option.value)}
      className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border flex items-center justify-center gap-2 ${
        isHorizontal ? 'px-3 h-[44px] flex-1 min-w-[120px]' : 'w-full max-w-[320px] px-5'
      } ${
        isSelected
          ? 'bg-gradient-to-r from-[#253F94] to-[#001C79] text-white border-transparent'
          : 'bg-white text-gray-800 border-white/80 hover:bg-white/90'
      }`}
    >
      {option.icon && (
        <Image src={option.icon} alt="" width={18} height={18} className="flex-shrink-0" />
      )}
      <span className="whitespace-nowrap">{option.label}</span>
    </button>
  );
}

function SmartAnalyzerStep({ step, activeValue, onSelect, visible, stepIndex }) {
  return (
    <div
      className="transition-all duration-500 ease-in-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <p className="text-white/70 text-sm mb-4 text-center">{step.question}</p>
      <div className="flex gap-3 flex-row justify-center flex-nowrap">
        {step.options.map((option) => (
          <SelectionButton
            key={option.value}
            option={option}
            isSelected={activeValue === option.value}
            onClick={onSelect}
            layout="horizontal"
          />
        ))}
      </div>
    </div>
  );
}

const analyzerSteps = [
  {
    id: 'goal',
    question: 'Generating Personalized Listing',
    layout: 'horizontal',
    options: [
      { label: 'Flipping', value: 'flipping', icon: '/HandCoins.svg' },
      { label: 'Capital Appreciation', value: 'appreciation', icon: '/Money.svg' },
    ],
  },
  {
    id: 'holding',
    question: 'How long do you usually hold a property before selling?',
    layout: 'horizontal',
    options: [
      { label: 'Less than 1 year', value: 'short' },
      { label: '1-3 years', value: 'mid' },
      { label: '3+ years', value: 'long' },
    ],
  },
  {
    id: 'returns',
    question: "What's your ideal return expectation?",
    layout: 'vertical',
    options: [
      { label: '6-10% Short-Term', value: 'return-short' },
      { label: '6-8% Stable return', value: 'return-stable' },
      { label: 'Above 20% if High Potential', value: 'return-aggressive' },
    ],
  },
  {
    id: 'budget',
    question: "What's your investment range?",
    layout: 'vertical',
    options: [
      { label: 'AED 500K - 800K', value: 'budget-low' },
      { label: 'AED 800K - 1.5M', value: 'budget-mid' },
      { label: 'AED 3M+', value: 'budget-high' },
    ],
  },
];

export default function Hero() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Ready');
  const [selectedEmirate, setSelectedEmirate] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const [analyzerAnswers, setAnalyzerAnswers] = useState({});
  const [analyzerStep, setAnalyzerStep] = useState(0);
  const [analyzerAnimating, setAnalyzerAnimating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleAnalyzerSelect = (value) => {
    if (analyzerAnimating) return;
    const currentStep = analyzerSteps[analyzerStep];
    const newAnswers = { ...analyzerAnswers, [currentStep.id]: value };
    setAnalyzerAnswers(newAnswers);
    setAnalyzerAnimating(true);
    
    setTimeout(() => {
      setAnalyzerAnimating(false);
      if (analyzerStep < analyzerSteps.length - 1) {
        setAnalyzerStep((prev) => prev + 1);
      } else {
        // Redirect to explore page with answers
        const queryParams = new URLSearchParams(newAnswers).toString();
        router.push(`/explore?${queryParams}`);
      }
    }, 350);
  };

  const resetAnalyzer = () => {
    setAnalyzerStep(0);
    setAnalyzerAnswers({});
  };

  return (
    <section className="relative h-screen min-h-[700px] bg-transparent">
      {/* Background Grid */}
      <div className="absolute bottom-25 right-10 w-full h-[80%] pointer-events-none">
        <Image
          src="/HeroGrid.svg"
          alt=""
          fill
          className="object-cover object-right-bottom opacity-70"
          priority
        />
      </div>

      {/* Building Illustration - larger size */}
      <div className="absolute right-[-30px] lg:right-[0px] top-1/2 -translate-y-[35%] pointer-events-none hidden md:block">
        <Image
          src="/HeroBuilding.svg"
          alt="Modern building illustration"
          width={547}
          height={763}
          className="w-[400px] lg:w-[520px] xl:w-[620px]"
          priority
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center pt-40 md:pt-20">
        <div className="w-full px-8 lg:px-16 xl:px-24">
          <div className="max-w-[850px]">
            {/* Headline - Light/thin weight */}
            <h1 className="font-heading text-[36px] sm:text-[44px] md:text-[52px] lg:text-[60px] font-normal text-white leading-[1.15] mb-4 tracking-normal">
              Build Your Secure Future<br />
              Through Real Estate
            </h1>

            {/* Description */}
            <p className="text-gray-400 text-[18px] sm:text-[19px] leading-[1.8] mb-12 max-w-[850px] font-normal">
              We don&apos;t just sell properties  we build futures, create financial freedom, and <br/>protect your legacy through real estate, the world&apos;s most reliable investment.
            </p>

            {/* ========== HERO BOX ========== */}
            <div className="inline-flex flex-col">
              
              {/* Tabs Row - Shorter width, just fits the tabs */}
              <div className="bg-[#3a4556] rounded-t-[4px] inline-flex self-start">
                <button
                  onClick={() => setActiveTab('Ready')}
                  className={`relative px-6 py-3 text-[16px] font-normal transition-all ${
                    activeTab === 'Ready'
                      ? 'text-white'
                      : 'text-[#D6D6D6] hover:text-white'
                  }`}
                >
                  Ready
                  {activeTab === 'Ready' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-white" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('offplan')}
                  className={`relative px-6 py-3 text-[16px] font-normal transition-all ${
                    activeTab === 'offplan'
                      ? 'text-white'
                      : 'text-[#D6D6D6] hover:text-white'
                  }`}
                >
                  Off Plan
                  {activeTab === 'offplan' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-white" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('analyzer')}
                  className={`relative px-6 py-3 text-[16px] font-normal transition-all ${
                    activeTab === 'analyzer'
                      ? 'text-white'
                      : 'text-[#D6D6D6] hover:text-white'
                  }`}
                >
                  Smart Analyzer
                  {activeTab === 'analyzer' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-white" />
                  )}
                </button>
              </div>

              {/* Form/Analyzer Content */}
              <div className="bg-[#3a4556] px-[27px] py-5 rounded-b-[4px] rounded-tr-[4px]">
                {/* Validation Error Message */}
                {validationError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-[4px] text-red-300 text-sm animate-in fade-in duration-300">
                    {validationError}
                  </div>
                )}
                
                {/* Filter Section - Ready and Off Plan tabs */}
                {(activeTab === 'Ready' || activeTab === 'offplan') && (
                  <div className="flex flex-col sm:flex-row items-end gap-4">
                    {/* Select Emirate */}
                    <div className="w-full sm:w-auto">
                      <label className="block text-[14px] text-white mb-2 font-normal">
                        Select Emirate
                      </label>
                      <div className="relative">
                        <select 
                          value={selectedEmirate}
                          onChange={(e) => setSelectedEmirate(e.target.value)}
                          className="w-[250px] h-[44px] bg-white text-black text-[16px] px-4 rounded-[4px] border border-[#E9E9E9] focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Select</option>
                          <option value="Dubai">Dubai</option>
                          <option value="Abu_Dhabi">Abu Dhabi</option>
                          <option value="Sharjah">Sharjah</option>
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none" fill="none" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Property Type */}
                    <div className="w-full sm:w-auto">
                      <label className="block text-[14px] text-white mb-2 font-normal">
                        Property Type
                      </label>
                      <div className="relative">
                        <select 
                          value={selectedPropertyType}
                          onChange={(e) => setSelectedPropertyType(e.target.value)}
                          className="w-[250px] h-[44px] bg-white text-black text-[16px] px-4 rounded-[4px] border border-[#E9E9E9] focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Select</option>
                          <option value="Apartment">Apartment</option>
                          <option value="Villa">Villa</option>
                          <option value="Townhouse">Townhouse</option>
                          <option value="Penthouse">Penthouse</option>
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none" fill="none" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Browse Properties Button */}
                    <button
                      type="button"
                      onClick={() => {
                        // Validate inputs
                        if (!selectedEmirate || !selectedPropertyType) {
                          setValidationError('Please select both Emirate and Property Type');
                          // Clear error after 3 seconds
                          setTimeout(() => setValidationError(''), 3000);
                          return;
                        }
                        const params = new URLSearchParams();
                        if (selectedEmirate) params.set('emirate', selectedEmirate);
                        if (selectedPropertyType) params.set('type', selectedPropertyType);
                        params.set('category', activeTab);
                        const queryString = params.toString();
                        router.push(`/properties${queryString ? `?${queryString}` : ''}`);
                      }}
                      className="w-[190px] h-[44px] bg-gradient-to-r from-[#253F94] to-[#001C79] hover:from-[#1e3580] hover:to-[#001565] text-white text-[16px] font-medium rounded-[4px] transition-all whitespace-nowrap"
                    >
                      Browse Properties
                    </button>
                  </div>
                )}

              {/* Analyzer Section - Smart Analyzer tab */}
              {activeTab === 'analyzer' && (
                <div className="flex flex-row items-center gap-4 overflow-hidden" style={{ width: '700px' }}>
                  <div
                    key={analyzerSteps[analyzerStep].id}
                    className={`transition-all duration-500 flex-1 overflow-hidden ${
                      analyzerAnimating ? 'opacity-0 -translate-y-3' : 'opacity-100 translate-y-0'
                    }`}
                  >
                    <SmartAnalyzerStep
                      step={analyzerSteps[analyzerStep]}
                      activeValue={analyzerAnswers[analyzerSteps[analyzerStep].id]}
                      onSelect={handleAnalyzerSelect}
                      visible={!analyzerAnimating}
                      stepIndex={analyzerStep}
                    />
                  </div>

                  <button
                    onClick={resetAnalyzer}
                    className="text-white/60 hover:text-white text-sm transition-colors flex-shrink-0 whitespace-nowrap"
                  >
                    Reset
                  </button>
                </div>
              )}
              </div>
            </div>
            {/* ========== END HERO BOX ========== */}

          </div>
        </div>
      </div>
    </section>
  );
}
