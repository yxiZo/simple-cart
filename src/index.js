import mitt from 'mitt';

/**
 * @description cart 类 用于管理购物车数据
 */
export class Cart { 
    /**
     * item  { 
     *     id: string;
     *     price: number;
     *     quantity?: number;
     *     itemTotal?: number;
     *     [key: string]: any;
     * }
     */
    initialState = {
        items: [],
        isEmpty: true,
        totalItems: 0,
        totalUniqueItems: 0,
        cartTotal: 0,
        metadata: {},
    };

    state={}

    onItemAdd
    onItemRemove
    onItemUpdate

    constructor({
        onItemAdd=() => {},
        onItemUpdate=() => {},
        onItemRemove=() => {}
    }) {
        this.state = JSON.parse(JSON.stringify(this.initialState))
        // 
        this.emitter = mitt()
        // listen to all events
        this.emitter.on('*', (type, e={}) => {
            let action = type
            this.state = this.reducer(this.state, {
                type,
                ...e
            })
        })
    }

    // 
    calculateUniqueItems(items) {
        return items.length;
    }


    // 设置itemTotal 字段 计算 单个sku 总价
    calculateItemTotals(items) {
        return items.map(item => ({
            ...item,
            itemTotal: item.price * item.quantity,
        }));
    }

    // 计算 购物车总价格
    calculateTotal(items) {
        return items.reduce((total, item) => total + item.quantity * item.price, 0);
    }

    // 计算 购物车 总数量
    calculateTotalItems(items) {
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }


    generateCartState(state = initialState, items){
        const totalUniqueItems = this.calculateUniqueItems(items);
        const isEmpty = totalUniqueItems === 0;
      
        return {
          ...this.initialState,
          ...this.state,
          items: this.calculateItemTotals(items),
          totalItems: this.calculateTotalItems(items),
          totalUniqueItems,
          cartTotal: this.calculateTotal(items),
          isEmpty,
        };
    };

    reducer(state, action) {
        const generateCartState = this.generateCartState.bind(this)
        switch (action.type) {
          case "SET_ITEMS":
            return generateCartState(state, action.payload);
      
          case "ADD_ITEM": {
            const items = [...state.items, action.payload];
      
            return generateCartState(state, items);
          }
      
          case "UPDATE_ITEM": {
            const items = state.items.map((item) => {
              if (item.id !== action.id) return item;
      
              return {
                ...item,
                ...action.payload,
              };
            });
      
            return generateCartState(state, items);
          }
      
          case "REMOVE_ITEM": {
            const items = state.items.filter((i) => i.id !== action.id);
      
            return generateCartState(state, items);
          }
      
          case "EMPTY_CART":
            return this.initialState;
      
          case "CLEAR_CART_META":
            return {
              ...state,
              metadata: {},
            };
      
          case "SET_CART_META":
            return {
              ...state,
              metadata: {
                ...action.payload,
              },
            };
      
          case "UPDATE_CART_META":
            return {
              ...state,
              metadata: {
                ...state.metadata,
                ...action.payload,
              },
            };
      
          default:
            throw new Error("No action specified");
        }
    }
    
    /**
     * @description 添加商品  增加钩子onItemAdd onItemUpdate
     */
    addItem(item, quantity) {
        if (!item.id) throw new Error("You must provide an `id` for items");
        if (quantity <= 0) return;
        const currentItem = this.getItem(item.id);
        if (!currentItem && !item.hasOwnProperty("price"))
            throw new Error("You must pass a `price` for new items");
      
        if (!currentItem) {
            const payload = { ...item, quantity };
      
            this.emitter.emit("ADD_ITEM", {
                payload: payload
            });
      
            this.onItemAdd && this.onItemAdd(payload);
      
            return;
        }
        const payload = { ...item, quantity: currentItem.quantity + quantity };

        this.emitter.emit("UPDATE_ITEM", {
            id: item.id,
            payload: payload
        });
      
        this.onItemUpdate && this.onItemUpdate(payload);
    }

    removeItem(id) {
        if (!id) return;

        this.emitter.emit("REMOVE_ITEM" , { id });
    
        onItemRemove && onItemRemove(id);
    }

    updateItem(id, payload) {
        if (!id || !payload) {
            return;
        }
       
        this.emitter.emit("UPDATE_ITEM", { id, payload });
        this.onItemUpdate && this.onItemUpdate(payload);
    }

    getItem (id) {
        return this.state.items.find((i) => i.id === id);
    }
    

    getItemQuantity (id) {
        const targetItem = this.getItem(id)
        return  targetItem ? targetItem.quantity : 0;
    } 

    getSpecQuantity(spec) {
        return this.state.items.reduce((sum, item) => {
            if(item.specsS.includes(spec)){
                sum = sum + item.quantity
            }
            return sum
        }, 0)
    }

    updateItemQuantity(id, quantity) {
        if (quantity <= 0) {
            this.onItemRemove && this.onItemRemove(id);
            this.emitter.emit("REMOVE_ITEM" , { id });   
            return;
        }

        const currentItem = this.getItem(id);

        if (!currentItem) throw new Error("No such item to update");
    
        const payload = { ...currentItem, quantity };
    
        this.emitter.emit("UPDATE_ITEM" , {
          id,
          payload,
        });
    
        this.onItemUpdate && this.onItemUpdate(payload);
    }

    updateItemQuantity2(item, quantity) {
        let id = item.id
        if (!item.id) throw new Error("You must provide an `id` for items");
        if (quantity <= 0) {
            this.onItemRemove && this.onItemRemove(id);
            this.emitter.emit("REMOVE_ITEM" , { id });   
            return;
        }

        const currentItem = this.getItem(id);

        if (!currentItem) {
            const payload = { ...item, quantity };
      
            this.emitter.emit("ADD_ITEM", {
                payload: payload
            });
      
            this.onItemAdd && this.onItemAdd(payload);
      
            return;
        }
    
        const payload = { ...currentItem, quantity };
    
        this.emitter.emit("UPDATE_ITEM" , {
          id,
          payload,
        });
    
        this.onItemUpdate && this.onItemUpdate(payload);
    }


    emptyCart() {
        this.emitter.emit("EMPTY_CART" );
        onEmptyCart && onEmptyCart();
    }

    inCart (id) {
        return this.state.items.some((i) => i.id === id);
    }


    clearCartMetadata  ()  {
        this.emitter.emit("CLEAR_CART_META", {
          type: "CLEAR_CART_META",
        });
      };
    
    setCartMetadata (metadata) {
        if (!metadata) return;
    
        this.emitter.emit("SET_CART_META", {
          payload: metadata,
        });
      };
    
    updateCartMetadata (metadata)  {
        if (!metadata) return;
    
        this.emitter.emit("UPDATE_CART_META" ,{
          payload: metadata,
        });
    };
}



