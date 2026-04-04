interface Props {
  onConfirm: () => void;
}

export default function DisclaimerModal({ onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="max-w-sm w-full mx-4 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a1a] rounded-2xl border border-xian-gold/30 p-6 shadow-2xl text-center">
        <div className="text-4xl mb-3">📜</div>
        <h2 className="text-lg font-bold font-kai text-xian-gold mb-4">版权声明</h2>
        <p className="text-sm text-xian-gold/80 leading-relaxed mb-6">
          JJBOOM老用户群专用摸鱼游戏
          <br />
          买电脑淘宝搜索JJBOOM
        </p>
        <button
          onClick={onConfirm}
          className="w-full py-2.5 rounded-xl font-bold font-kai bg-gradient-to-r from-xian-gold/80 to-yellow-500/80 text-[#0a0a1a] hover:from-xian-gold hover:to-yellow-500 transition-all active:scale-95"
        >
          确定
        </button>
      </div>
    </div>
  );
}
