import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import CartUtil from '../utils/CartUtil';
import axios from 'axios';
import withRouter from '../utils/withRouter';
import { Link } from 'react-router-dom';
import '../Css/Mycart.css';

class Mycart extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      successMessage: '',
      orderId: null,
      productIds: [],
      productDetails: [],
      selectAll: false,
    };
  }

  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  handleSelectAll = () => {
    this.setState(prevState => ({ selectAll: !prevState.selectAll }));
    const { mycart } = this.context;
    if (!this.state.selectAll) {
      // select all products (add logic if needed)
      const selectedProductIds = mycart.map(item => item.product._id);
      this.setState({ productIds: selectedProductIds });
    } else {
      // deselect all
      this.setState({ productIds: [] });
    }
  }

  render() {
    const { mycart } = this.context;

    if (mycart.length === 0) {
      return (
        <div className="empty-cart">
          <h2>Chưa có sản phẩm nào trong giỏ hàng</h2>
          <p>Cùng mua sắm hàng ngàn sản phẩm tại TechZone nhé!</p>
          <Link to="/home" className="btn-purchase">Mua hàng</Link>
          <img 
            src="https://fptshop.com.vn/img/empty_cart.png?w=1920&q=100" 
            alt="Empty cart" 
            className="empty-cart-image" 
          />
        </div>
      );
    }

    const totalItems = mycart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = CartUtil.getTotal(mycart);
    
    const cartItems = mycart.map((item, index) => (
      <tr key={item.product._id} className="datatable">
        <td>{index + 1}</td>
        <td>{item.product._id}</td>
        <td>{item.product.name}</td>
        <td>{item.product.category.name}</td>
        <td><img src={"data:image/jpg;base64," + item.product.image} width="70px" height="70px" alt="" /></td>
        <td>{this.formatPrice(item.product.price)}</td>
        <td>{item.quantity}</td>
        <td>{this.formatPrice(item.product.price * item.quantity)}</td>
        <td><span className="link" onClick={() => this.lnkRemoveClick(item.product._id)}>DELETE</span></td>
      </tr>
    ));

    return (
      <div className="align-center">
        {this.state.successMessage ? (
          <div className="success-message">
            <div className="success-icon">
              <span>&#10004;</span>
            </div>
            <h2>Thanh toán thành công</h2>
            <p>Mã số đơn hàng của bạn là <span className="order-id">{this.state.orderId}</span></p>
            <p>Chi tiết sản phẩm của đơn hàng:</p>
            <ul>
              {this.state.productDetails.map((product, index) => (
                <li key={index}>
                  <img src={"data:image/jpg;base64," + product.image} alt={product.name} />
                  <div>
                    <p>ID: {product.id}</p>
                    <p>Tên sản phẩm: {product.name}</p>
                    <p>Giá: {this.formatPrice(product.price)}</p>
                    <p>Số lượng: {product.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className='chitiet'>
              Bạn có thể xem chi tiết trong <Link to="/myorders">đơn hàng của tôi</Link>
            </div>
            <button onClick={() => this.props.navigate('/home')}>TIẾP TỤC MUA HÀNG</button>
          </div>
        ) : (
          <>
            <h2 className="text-center-itemlist" style={{ color: 'orange', animation: 'color-change 1s infinite' }}>GIỎ HÀNG</h2>
            <table className="datatable" border="1">
              <tbody>
                <tr className="datatable">
                  <th>No.</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Image</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
                {cartItems}
              </tbody>
            </table>
            <div className="total-section">
  <div className="total-info">
  <button className="btn-continue" onClick={() => this.props.navigate('/home')}>
  <i className="fa fa-arrow-left"></i> Tiếp tục mua hàng / Quay lại trang chủ
</button>

  </div>
  <div>
  <span className="total-label">TỔNG TIỀN TẠM TÍNH</span>
    <span className="total-amount">{this.formatPrice(totalPrice)}</span>
    <p className="total-items">({totalItems} sản phẩm)</p>
    <button className="btn-checkout" onClick={() => this.lnkCheckoutClick()}>TIẾN HÀNH THANH TOÁN</button>
  </div>
</div>

          </>
        )}
      </div>
    );
  }

  // event-handlers
  lnkRemoveClick(id) {
    if (window.confirm('DELETE THIS ITEM? ARE YOU SURE?')) {
      const mycart = this.context.mycart;
      const index = mycart.findIndex(x => x.product._id === id);
      if (index !== -1) { // found, remove item
        mycart.splice(index, 1);
        this.context.setMycart(mycart);
      }
    }
  }

  lnkCheckoutClick() {
    if (window.confirm('ARE YOU SURE?')) {
      if (this.context.mycart.length > 0) {
        const total = CartUtil.getTotal(this.context.mycart);
        const items = this.context.mycart;
        const customer = this.context.customer;
        if (customer) {
          if (this.context.token) {
            console.log("Token before checkout:", this.context.token);
            this.apiCheckout(total, items, customer);
          } else {
            console.log("Invalid or missing token");
            this.props.navigate('/login');
          }
        } else {
          this.props.navigate('/login');
        }
      } else {
        alert('Your cart is empty');
      }
    }
  }

  apiCheckout(total, items, customer) {
    const productDetails = items.map(item => ({
      id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image
    }));
    const body = { total: total, items: items, customer: customer };
    const config = { headers: { 'x-access-token': this.context.token } };
  
    axios.post('/api/customer/checkout', body, config)
      .then((res) => {
        const result = res.data;
        if (result && result._id) {
          this.setState({ 
            successMessage: 'Checkout successful! Thank you for your purchase.',
            orderId: result._id,
            productDetails: productDetails
          });
          setTimeout(() => {
            this.context.setMycart([]);
            this.setState({ successMessage: '' });
          }, 10000);
        } else {
          alert('SORRY BABY!');
        }
      })
      .catch(error => {
        console.error("API Error:", error);
        if (error.response) {
          console.log("Error Status:", error.response.status);
          if (error.response.status === 401) {
            console.log("Unauthorized - Token issue");
            this.props.navigate('/login');
          } else {
            alert('An error occurred during checkout. Please try again.');
          }
        }
      });
  }
}

export default withRouter(Mycart);
