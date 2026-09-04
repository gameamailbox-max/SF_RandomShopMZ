/*:
 * @target MZ
 * @plugindesc ランダム商品・1個限定販売に対応したショップを作成します。
 * @author 巣ごもり梟
 *
 * @param SoldOutTextColor
 * @text 売り切れ文字色
 * @desc 購入済み商品の文字色です。\C[n]の形式で指定してください。
 * @type string
 * @default \C[8]
 *
 * @command SetupRandomShop
 * @text ランダムショップ設定
 * @desc 直後の「ショップの処理」をランダムショップとして設定します。
 *
 * @arg ShopId
 * @text ショップID
 * @desc ショップを識別する固有IDです。原則としてショップごとに異なるIDを指定してください。
 * @type string
 * @default
 *
 * @arg ResetSwitchId
 * @text リセットスイッチ
 * @desc ONの場合、保存済みのショップ状態を破棄して再抽選します。「なし」の場合は自動リセットしません。
 * @type switch
 * @default 0
 * 
 * @arg MaxProductTypes
 * @text 最大商品種類数
 * @desc ショップに並ぶ商品の最大種類数です。0の場合は制限しません。
 * @type number
 * @min 0
 * @decimals 0
 * @default 0
 *
 * @arg ItemCandidates
 * @text アイテム候補
 * @desc ランダムショップに出現するアイテム候補です。
 * @type struct<ItemCandidate>[]
 * @default []
 *
 * @arg WeaponCandidates
 * @text 武器候補
 * @desc ランダムショップに出現する武器候補です。
 * @type struct<WeaponCandidate>[]
 * @default []
 *
 * @arg ArmorCandidates
 * @text 防具候補
 * @desc ランダムショップに出現する防具候補です。
 * @type struct<ArmorCandidate>[]
 * @default []
 *
 * @help
 * ============================================================================
 * SF_RandomShopMZ
 * ============================================================================
 *
 * 専用プラグインコマンドの直後に「ショップの処理」を配置することで、
 * 商品候補からランダムに商品を選出するショップを作成します。
 *
 * ランダムショップ設定が適用された場合、
 * 「ショップの処理」に登録されている商品は使用しません。
 *
 * 商品の抽選結果・販売価格・購入済み状態はショップIDごとに保存され、
 * リセットスイッチがONになるまで維持されます。
 *
 * リセットスイッチに「なし」を指定した場合は、自動リセットされません。
 *
 * 同じショップIDを複数の場所で使用した場合、
 * 同じショップ状態を共有します。
 *
 * 商品は1種類につき1個のみ購入できます。
 * 購入済みの商品は一覧に残り、指定された売り切れ文字色で表示されます。
 *
 * 売却には対応せず、購入専用ショップとして動作します。
 *
 * ============================================================================
 */

/*~struct~ItemCandidate:
 * @param ItemId
 * @text 商品
 * @desc 候補にするアイテムです。
 * @type item
 * @default 1
 *
 * @param AppearanceRate
 * @text 出現率
 * @desc この商品が出現する確率です。0～100の整数で指定します。
 * @type number
 * @min 0
 * @max 100
 * @decimals 0
 * @default 100
 *
 * @param PriceType
 * @text 価格設定
 * @desc 標準価格または指定価格を選択します。
 * @type select
 * @option 標準価格
 * @value standard
 * @option 指定価格
 * @value custom
 * @default standard
 *
 * @param CustomPrice
 * @text 指定価格
 * @desc 「指定価格」を選択した場合に使用する販売価格です。
 * @type number
 * @min 0
 * @default 0
 */

/*~struct~WeaponCandidate:
 * @param WeaponId
 * @text 商品
 * @desc 候補にする武器です。
 * @type weapon
 * @default 1
 *
 * @param AppearanceRate
 * @text 出現率
 * @desc この商品が出現する確率です。0～100の整数で指定します。
 * @type number
 * @min 0
 * @max 100
 * @decimals 0
 * @default 100
 *
 * @param PriceType
 * @text 価格設定
 * @desc 標準価格または指定価格を選択します。
 * @type select
 * @option 標準価格
 * @value standard
 * @option 指定価格
 * @value custom
 * @default standard
 *
 * @param CustomPrice
 * @text 指定価格
 * @desc 「指定価格」を選択した場合に使用する販売価格です。
 * @type number
 * @min 0
 * @default 0
 */

/*~struct~ArmorCandidate:
 * @param ArmorId
 * @text 商品
 * @desc 候補にする防具です。
 * @type armor
 * @default 1
 *
 * @param AppearanceRate
 * @text 出現率
 * @desc この商品が出現する確率です。0～100の整数で指定します。
 * @type number
 * @min 0
 * @max 100
 * @decimals 0
 * @default 100
 *
 * @param PriceType
 * @text 価格設定
 * @desc 標準価格または指定価格を選択します。
 * @type select
 * @option 標準価格
 * @value standard
 * @option 指定価格
 * @value custom
 * @default standard
 *
 * @param CustomPrice
 * @text 指定価格
 * @desc 「指定価格」を選択した場合に使用する販売価格です。
 * @type number
 * @min 0
 * @default 0
 */

(() => {
    "use strict";

    const pluginName = "SF_RandomShopMZ";

    const parameters =
        PluginManager.parameters(pluginName);

    const soldOutTextColor =
        String(
            parameters["SoldOutTextColor"] || "\\C[8]"
        );

    function soldOutColorIndex() {

        const match =
            soldOutTextColor.match(
                /\\C\[(\d+)\]/i
            );

        if (match) {
            return Number(match[1]);
        }

        return 8;
    }
   
    //=========================================================================
    // Game_System
    // ランダムショップ保存領域
    //=========================================================================

    const _Game_System_initialize =
        Game_System.prototype.initialize;

    Game_System.prototype.initialize =
        function() {

            _Game_System_initialize.call(this);

            this._sfRandomShopStates = {};
        };

    Game_System.prototype.sfRandomShopStates =
        function() {

            if (!this._sfRandomShopStates) {
                this._sfRandomShopStates = {};
            }

            return this._sfRandomShopStates;
        };

    //=========================================================================
    // 候補データ解析
    //=========================================================================

    function parseStructArray(text) {

        if (!text) {
            return [];
        }

        let array;

        try {
            array = JSON.parse(text);
        } catch (error) {
            console.warn(
                `[${pluginName}] 候補リストの解析に失敗しました。`,
                error
            );
            return [];
        }

        const result = [];

        for (const entry of array) {

            try {
                result.push(
                    JSON.parse(entry)
                );
            } catch (error) {
                console.warn(
                    `[${pluginName}] 候補データの解析に失敗しました。`,
                    error
                );
            }
        }

        return result;
    }

    function makeCandidate(
        kind,
        data
    ) {

        let id = 0;

        if (kind === "item") {
            id = Number(data.ItemId || 0);
        } else if (kind === "weapon") {
            id = Number(data.WeaponId || 0);
        } else if (kind === "armor") {
            id = Number(data.ArmorId || 0);
        }

        return {
            kind: kind,
            id: id,
            rate: Number(
                data.AppearanceRate || 0
            ),
            priceType:
                String(
                    data.PriceType ||
                    "standard"
                ),
            customPrice:
                Number(
                    data.CustomPrice || 0
                )
        };
    }

    function makeCandidateList(args) {

        const result = [];

        const itemCandidates =
            parseStructArray(
                args.ItemCandidates
            );

        const weaponCandidates =
            parseStructArray(
                args.WeaponCandidates
            );

        const armorCandidates =
            parseStructArray(
                args.ArmorCandidates
            );

        for (const data of itemCandidates) {
            result.push(
                makeCandidate(
                    "item",
                    data
                )
            );
        }

        for (const data of weaponCandidates) {
            result.push(
                makeCandidate(
                    "weapon",
                    data
                )
            );
        }

        for (const data of armorCandidates) {
            result.push(
                makeCandidate(
                    "armor",
                    data
                )
            );
        }

        return result;
    }

    //=========================================================================
    // ランダムショップ状態生成
    //=========================================================================

    function candidateKey(candidate) {
        return `${candidate.kind}:${candidate.id}`;
    }

    function removeDuplicateCandidates(candidates) {

        const result = [];
        const seen = new Set();

        for (const candidate of candidates) {

            const key =
                candidateKey(candidate);

            if (
                candidate.id <= 0 ||
                seen.has(key)
            ) {
                continue;
            }

            seen.add(key);
            result.push(candidate);
        }

        return result;
    }

    function candidateDatabaseObject(candidate) {

        if (candidate.kind === "item") {
            return $dataItems[candidate.id];
        }

        if (candidate.kind === "weapon") {
            return $dataWeapons[candidate.id];
        }

        if (candidate.kind === "armor") {
            return $dataArmors[candidate.id];
        }

        return null;
    }

    function candidateRate(candidate) {

        return Math.max(
            0,
            Math.min(
                100,
                Math.floor(
                    Number(candidate.rate || 0)
                )
            )
        );
    }

    function resolveCandidatePrice(candidate) {

        if (candidate.priceType === "custom") {

            return Math.max(
                0,
                Math.floor(
                    Number(
                        candidate.customPrice || 0
                    )
                )
            );
        }

        const object =
            candidateDatabaseObject(candidate);

        return object
            ? Math.max(
                0,
                Math.floor(
                    Number(object.price || 0)
                )
            )
            : 0;
    }

    function limitSelectedCandidates(
        selected,
        maxProductTypes
    ) {

        if (
            maxProductTypes <= 0 ||
            selected.length <= maxProductTypes
        ) {
            return selected;
        }

        const shuffled =
            selected.slice();

        for (
            let i = shuffled.length - 1;
            i > 0;
            i--
        ) {
            const j =
                Math.floor(
                    Math.random() * (i + 1)
                );

            const temp =
                shuffled[i];

            shuffled[i] =
                shuffled[j];

            shuffled[j] =
                temp;
        }

        const chosen =
            new Set(
                shuffled
                    .slice(0, maxProductTypes)
                    .map(candidateKey)
            );

        return selected.filter(
            candidate =>
                chosen.has(
                    candidateKey(candidate)
                )
        );
    }

    function makeRandomShopGoods(
        candidates,
        maxProductTypes
    ) {

        const validCandidates =
            removeDuplicateCandidates(candidates)
                .filter(candidate => {

                    return (
                        candidateDatabaseObject(candidate) &&
                        candidateRate(candidate) > 0
                    );
                });

        if (validCandidates.length === 0) {
            return null;
        }

        let selected = [];

        while (selected.length === 0) {

            selected =
                validCandidates.filter(
                    candidate => {

                        return (
                            Math.random() * 100 <
                            candidateRate(candidate)
                        );
                    }
                );
        }

        selected =
            limitSelectedCandidates(
                selected,
                maxProductTypes
            );

        return selected.map(
            candidate => ({
                kind: candidate.kind,
                id: candidate.id,
                price:
                    resolveCandidatePrice(
                        candidate
                    ),
                purchased: false
            })
        );
    }

    function getRandomShopState(setup) {

        const states =
            $gameSystem.sfRandomShopStates();

        const stateKey =
            "$" + setup.shopId;

        const resetRequested =
            setup.resetSwitchId > 0 &&
            $gameSwitches.value(
                setup.resetSwitchId
            );

        if (
            states[stateKey] &&
            !resetRequested
        ) {
            return states[stateKey];
        }

        const goods =
            makeRandomShopGoods(
                setup.candidates,
                setup.maxProductTypes
            );

        if (!goods) {

            if (resetRequested) {
                delete states[stateKey];
            }

            console.warn(
                `[${pluginName}] ショップID「${setup.shopId}」には抽選可能な商品がありません。ショップを開きません。`
            );

            return null;
        }

        const state = {
            shopId: setup.shopId,
            goods: goods
        };

        states[stateKey] = state;

        return state;
    }

    function getStoredRandomShopState(
        shopId
    ) {

        const states =
            $gameSystem.sfRandomShopStates();

        return states["$" + shopId] || null;
    }

    function itemKind(item) {

        if (DataManager.isItem(item)) {
            return "item";
        }

        if (DataManager.isWeapon(item)) {
            return "weapon";
        }

        if (DataManager.isArmor(item)) {
            return "armor";
        }

        return "";
    }

    function findStateGoodByItem(
        state,
        item
    ) {

        if (!state || !item) {
            return null;
        }

        const kind =
            itemKind(item);

        return state.goods.find(
            good =>
                good.kind === kind &&
                good.id === item.id
        ) || null;
    }

    function isPurchasedRandomShopItem(
        item
    ) {

        const scene =
            SceneManager._scene;

        if (
            !scene ||
            !(scene instanceof Scene_Shop) ||
            !scene._sfRandomShopId
        ) {
            return false;
        }

        const state =
            getStoredRandomShopState(
                scene._sfRandomShopId
            );

        if (!state) {
            return false;
        }

        const good =
            findStateGoodByItem(
                state,
                item
            );

        return !!(
            good &&
            good.purchased
        );
    }

    //=========================================================================
    // プラグインコマンド
    // ランダムショップ設定
    //=========================================================================

    PluginManager.registerCommand(
        pluginName,
        "SetupRandomShop",
        function(args) {

            const shopId =
                String(
                    args.ShopId || ""
                ).trim();

            if (!shopId) {

                console.warn(
                    `[${pluginName}] ショップIDが空欄のため、ランダムショップ設定を無効化しました。`
                );

                this._sfRandomShopPendingSetup = null;

                return;
            }

            let expectedShopIndex =
                this._index + 1;

            while (
                this._list[expectedShopIndex] &&
                this._list[expectedShopIndex].code === 657
            ) {
                expectedShopIndex++;
            }

            this._sfRandomShopPendingSetup = {
                shopId: shopId,
                resetSwitchId:
                    Number(
                        args.ResetSwitchId || 0
                    ),
                maxProductTypes:
                    Math.max(
                        0,
                        Math.floor(
                            Number(
                                args.MaxProductTypes || 0
                            )
                        )
                    ),
                candidates:
                    makeCandidateList(args),
                expectedShopIndex:
                    expectedShopIndex
            };

        }
    );

    //=========================================================================
    // ショップ商品データ変換
    //=========================================================================

    function randomShopGoodsToMZGoods(state) {

        return state.goods.map(good => {

            let goodsType = 0;

            if (good.kind === "weapon") {
                goodsType = 1;
            } else if (good.kind === "armor") {
                goodsType = 2;
            }

            return [
                goodsType,
                good.id,
                1,
                good.price
            ];
        });
    }

    //=========================================================================
    // Game_Interpreter
    // プラグインコマンド直後のショップ判定
    //=========================================================================

    const _Game_Interpreter_command302 =
        Game_Interpreter.prototype.command302;

    Game_Interpreter.prototype.command302 =
        function(params) {

            const setup =
                this._sfRandomShopPendingSetup;
            this._sfRandomShopPendingSetup = null;

            if (
                !setup ||
                setup.expectedShopIndex !== this._index
            ) {
                return _Game_Interpreter_command302.call(
                    this,
                    params
                );
            }

            const state =
                getRandomShopState(setup);

            if (!state) {

                while (
                    this.nextEventCode() === 605
                ) {
                    this._index++;
                }

                return true;
            }

            const goods =
                randomShopGoodsToMZGoods(state);

            while (
                this.nextEventCode() === 605
            ) {
                this._index++;
            }

            $gameTemp._sfRandomShopId =
                setup.shopId;

            SceneManager.push(
                Scene_Shop
            );

            SceneManager.prepareNextScene(
                goods,
                true
            );

            return true;
        };

    //=========================================================================
    // Game_Interpreter
    // 直後以外への設定持ち越し防止
    //=========================================================================

    const _Game_Interpreter_executeCommand =
        Game_Interpreter.prototype.executeCommand;

    Game_Interpreter.prototype.executeCommand =
        function() {

            const setup =
                this._sfRandomShopPendingSetup;

            if (
                setup &&
                this._index === setup.expectedShopIndex &&
                this.currentCommand() &&
                this.currentCommand().code !== 302
            ) {
                this._sfRandomShopPendingSetup = null;
            }

            return _Game_Interpreter_executeCommand.call(
                this
            );
        };

    //=========================================================================
    // Scene_Shop
    // ランダムショップ識別
    //=========================================================================

    const _Scene_Shop_prepare =
        Scene_Shop.prototype.prepare;

    Scene_Shop.prototype.prepare =
        function(goods, purchaseOnly) {

            _Scene_Shop_prepare.call(
                this,
                goods,
                purchaseOnly
            );

            this._sfRandomShopId =
                $gameTemp._sfRandomShopId || null;

            $gameTemp._sfRandomShopId = null;
        };

    //=========================================================================
    // Window_ShopBuy
    // 購入済み商品の文字色
    //=========================================================================

    const _Window_ShopBuy_drawItem =
        Window_ShopBuy.prototype.drawItem;

    Window_ShopBuy.prototype.drawItem =
        function(index) {

            const item =
                this.itemAt(index);

            if (
                !item ||
                !isPurchasedRandomShopItem(item)
            ) {
                _Window_ShopBuy_drawItem.call(
                    this,
                    index
                );
                return;
            }

            const price =
                this.price(item);

            const rect =
                this.itemLineRect(index);

            const priceWidth =
                this.priceWidth();

            const iconY =
                rect.y +
                (
                    this.lineHeight() -
                    ImageManager.iconHeight
                ) / 2;

            const textMargin =
                ImageManager.iconWidth + 4;

            const itemNameWidth =
                Math.max(
                    0,
                    rect.width -
                    priceWidth -
                    textMargin
                );

            this.changePaintOpacity(true);

            this.drawIcon(
                item.iconIndex,
                rect.x,
                iconY
            );

            this.changeTextColor(
                ColorManager.textColor(
                    soldOutColorIndex()
                )
            );

            this.drawText(
                item.name,
                rect.x + textMargin,
                rect.y,
                itemNameWidth
            );

            this.resetTextColor();

            this.drawText(
                price,
                rect.x + rect.width - priceWidth,
                rect.y,
                priceWidth,
                "right"
            );

            this.changePaintOpacity(true);
        };

    //=========================================================================
    // Window_ShopBuy
    // 購入済み商品の購入禁止
    //=========================================================================

    const _Window_ShopBuy_isEnabled =
        Window_ShopBuy.prototype.isEnabled;

    Window_ShopBuy.prototype.isEnabled =
        function(item) {

            if (
                !_Window_ShopBuy_isEnabled.call(
                    this,
                    item
                )
            ) {
                return false;
            }

            const scene =
                SceneManager._scene;

            if (
                !scene ||
                !(scene instanceof Scene_Shop) ||
                !scene._sfRandomShopId
            ) {
                return true;
            }

            const state =
                getStoredRandomShopState(
                    scene._sfRandomShopId
                );

            if (!state) {
                return true;
            }

            const good =
                findStateGoodByItem(
                    state,
                    item
                );

            if (!good) {
                return true;
            }

            return !good.purchased;
        };

    //=========================================================================
    // Scene_Shop
    // 購入数上限1
    //=========================================================================

    const _Scene_Shop_maxBuy =
        Scene_Shop.prototype.maxBuy;

    Scene_Shop.prototype.maxBuy =
        function() {

            const max =
                _Scene_Shop_maxBuy.call(this);

            if (!this._sfRandomShopId) {
                return max;
            }

            return Math.min(
                max,
                1
            );
        };

    //=========================================================================
    // Scene_Shop
    // 購入成功時に購入済み状態を保存
    //=========================================================================

    const _Scene_Shop_doBuy =
        Scene_Shop.prototype.doBuy;

    Scene_Shop.prototype.doBuy =
        function(number) {

            _Scene_Shop_doBuy.call(
                this,
                number
            );

            if (
                !this._sfRandomShopId ||
                number <= 0
            ) {
                return;
            }

            const state =
                getStoredRandomShopState(
                    this._sfRandomShopId
                );

            if (!state) {
                return;
            }

            const good =
                findStateGoodByItem(
                    state,
                    this._item
                );

            if (!good) {
                return;
            }

            good.purchased = true;

            if (this._buyWindow) {
                this._buyWindow.refresh();
            }
        };

})();