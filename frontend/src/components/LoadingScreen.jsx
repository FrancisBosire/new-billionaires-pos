export default function LoadingScreen() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#1a1a2e",  // Your navy blue
      position: "relative"
    }}>
      {/* Logo Container */}
      <div style={{
        textAlign: "center",
        position: "relative",
        zIndex: 10
      }}>
        {/* NB Logo */}
        <div style={{
          width: "120px",
          height: "120px",
          margin: "0 auto 32px",
          position: "relative",
          animation: "logoFloat 3s ease-in-out infinite"
        }}>
          {/* Outer Ring */}
          <div style={{
            position: "absolute",
            inset: 0,
            border: "3px solid rgba(201, 168, 76, 0.3)",
            borderRadius: "50%",
            animation: "ringRotate 8s linear infinite"
          }} />
          
          {/* Inner Ring */}
          <div style={{
            position: "absolute",
            inset: "10px",
            border: "2px solid rgba(201, 168, 76, 0.5)",
            borderRadius: "50%",
            animation: "ringRotate 6s linear infinite reverse"
          }} />
          
          {/* NB Text */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Georgia, serif",
            fontSize: "48px",
            fontWeight: "800",
            color: "#c9a84c",
            letterSpacing: "2px",
            textShadow: "0 0 20px rgba(201, 168, 76, 0.5)",
            animation: "textGlow 2s ease-in-out infinite"
          }}>
            NB
          </div>
        </div>

        {/* Main Title - White */}
        <div style={{
          color: "#ffffff",
          fontSize: "18px",
          fontWeight: "700",
          letterSpacing: "4px",
          textTransform: "uppercase",
          marginBottom: "4px"
        }}>
          NEW BILLIONAIRES
        </div>

        {/* Subtitle - Gold */}
        <div style={{
          color: "#c9a84c",
          fontSize: "13px",
          letterSpacing: "2px",
          marginBottom: "24px"
        }}>
          Bar & Restaurant
        </div>

        {/* Loading Dots */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px"
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#c9a84c",
                animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes textGlow {
          0%, 100% { 
            textShadow: 0 0 20px rgba(201, 168, 76, 0.5);
            opacity: 1;
          }
          50% { 
            textShadow: 0 0 40px rgba(201, 168, 76, 0.8), 0 0 60px rgba(201, 168, 76, 0.4);
            opacity: 0.9;
          }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { 
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}